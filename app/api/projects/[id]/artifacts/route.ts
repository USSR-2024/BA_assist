// app/api/projects/[id]/artifacts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:ProjectArtifacts');

// GET /api/projects/:id/artifacts - Получить артефакты проекта
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authMiddleware(request);
  
  if ('success' in authResult === false) {
    return authResult;
  }
  
  if (!authResult.success) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: 401 }
    );
  }

  const projectId = parseInt(params.id);
  if (isNaN(projectId)) {
    return NextResponse.json(
      { success: false, error: 'Некорректный ID проекта' },
      { status: 400 }
    );
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status') as string | null;
  const stage = url.searchParams.get('stage') as string | null;

  try {
    // Проверка, имеет ли пользователь доступ к проекту
    const userId = authResult.userId;
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        users: { some: { id: userId } }
      }
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Проект не найден или доступ запрещён' },
        { status: 403 }
      );
    }

    // Формируем условия для фильтрации
    let whereClause: any = { projectId };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (stage) {
      whereClause.stage = stage;
    }

    // Получаем артефакты проекта
    const artifacts = await prisma.projectArtifact.findMany({
      where: whereClause,
      include: {
        artifact: true,
        file: {
          select: {
            id: true,
            name: true,
            gcsPath: true,
            size: true,
            status: true,
            uploadedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    logger.info(`Получено ${artifacts.length} артефактов для проекта ${projectId}`);
    return NextResponse.json({ success: true, data: artifacts }, { status: 200 });
  } catch (error) {
    logger.error(`Ошибка получения артефактов проекта ${projectId}:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при получении артефактов проекта' },
      { status: 500 }
    );
  }
}

// POST /api/projects/:id/artifacts - Создать артефакт проекта
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authMiddleware(request);
  
  if ('success' in authResult === false) {
    return authResult;
  }
  
  if (!authResult.success) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: 401 }
    );
  }

  const projectId = parseInt(params.id);
  if (isNaN(projectId)) {
    return NextResponse.json(
      { success: false, error: 'Некорректный ID проекта' },
      { status: 400 }
    );
  }

  try {
    // Получаем данные из запроса
    const data = await request.json();
    const { artifactId, stage, format, fileId } = data;

    // Проверяем наличие обязательных полей
    if (!artifactId || !stage || !format) {
      return NextResponse.json(
        { success: false, error: 'Не указаны обязательные поля: artifactId, stage, format' },
        { status: 400 }
      );
    }

    // Проверка, имеет ли пользователь доступ к проекту
    const userId = authResult.userId;
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        users: { some: { id: userId } }
      }
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Проект не найден или доступ запрещён' },
        { status: 403 }
      );
    }

    // Проверяем, существует ли такой артефакт в каталоге
    const catalogArtifact = await prisma.artifactCatalog.findUnique({
      where: { id: artifactId }
    });

    if (!catalogArtifact) {
      return NextResponse.json(
        { success: false, error: 'Указанный артефакт не найден в каталоге' },
        { status: 400 }
      );
    }

    // Проверяем, существует ли уже такой артефакт в проекте
    const existingArtifact = await prisma.projectArtifact.findFirst({
      where: {
        projectId,
        artifactId
      }
    });

    if (existingArtifact) {
      return NextResponse.json(
        { success: false, error: 'Данный артефакт уже добавлен в проект' },
        { status: 400 }
      );
    }

    // Проверяем файл, если он указан
    let file = null;
    if (fileId) {
      file = await prisma.file.findFirst({
        where: {
          id: fileId,
          projectId
        }
      });

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'Указанный файл не найден в проекте' },
          { status: 400 }
        );
      }
    }

    // Создаем новый артефакт проекта
    const projectArtifact = await prisma.projectArtifact.create({
      data: {
        projectId,
        artifactId,
        fileId: fileId || null,
        status: 'NOT_STARTED',
        stage,
        format,
        assignedToUserId: userId
      },
      include: {
        artifact: true,
        file: true
      }
    });

    // Если указан файл, обновляем его статус как артефакт
    if (fileId) {
      await prisma.file.update({
        where: { id: fileId },
        data: {
          artifactId,
          artifactStage: stage,
          isArtifact: true
        }
      });
    }

    logger.info(`Создан новый артефакт ${artifactId} для проекта ${projectId}`);
    return NextResponse.json(
      { success: true, data: projectArtifact },
      { status: 201 }
    );
  } catch (error) {
    logger.error(`Ошибка создания артефакта для проекта ${projectId}:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при создании артефакта' },
      { status: 500 }
    );
  }
}