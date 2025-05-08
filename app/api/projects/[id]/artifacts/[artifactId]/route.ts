// app/api/projects/[id]/artifacts/[artifactId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:ProjectArtifact');

// GET /api/projects/:id/artifacts/:artifactId - Получить конкретный артефакт проекта
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, artifactId: string } }
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
  const artifactId = params.artifactId;

  if (isNaN(projectId)) {
    return NextResponse.json(
      { success: false, error: 'Некорректный ID проекта' },
      { status: 400 }
    );
  }

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

    // Получаем артефакт проекта
    const projectArtifact = await prisma.projectArtifact.findFirst({
      where: {
        projectId,
        id: artifactId
      },
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
      }
    });

    if (!projectArtifact) {
      return NextResponse.json(
        { success: false, error: 'Артефакт не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: projectArtifact }, { status: 200 });
  } catch (error) {
    logger.error(`Ошибка получения артефакта ${artifactId} проекта ${projectId}:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при получении артефакта' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/:id/artifacts/:artifactId - Обновить артефакт проекта
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, artifactId: string } }
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
  const artifactId = params.artifactId;

  if (isNaN(projectId)) {
    return NextResponse.json(
      { success: false, error: 'Некорректный ID проекта' },
      { status: 400 }
    );
  }

  try {
    // Получаем данные из запроса
    const data = await request.json();
    const { status, fileId, assignedToUserId } = data;

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

    // Проверяем, существует ли артефакт в проекте
    const existingArtifact = await prisma.projectArtifact.findFirst({
      where: {
        projectId,
        id: artifactId
      }
    });

    if (!existingArtifact) {
      return NextResponse.json(
        { success: false, error: 'Артефакт не найден в проекте' },
        { status: 404 }
      );
    }

    // Проверяем файл, если он указан
    if (fileId) {
      const file = await prisma.file.findFirst({
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

    // Формируем данные для обновления
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
    }
    
    if (fileId !== undefined) {
      updateData.fileId = fileId;
    }
    
    if (assignedToUserId) {
      updateData.assignedToUserId = assignedToUserId;
    }
    
    // Увеличиваем версию артефакта при любом обновлении
    updateData.version = { increment: 1 };

    // Обновляем артефакт проекта
    const updatedArtifact = await prisma.projectArtifact.update({
      where: {
        id: artifactId
      },
      data: updateData,
      include: {
        artifact: true,
        file: true
      }
    });

    // Если файл был обновлен и существует, обновляем статус файла
    if (fileId) {
      await prisma.file.update({
        where: { id: fileId },
        data: {
          artifactId: existingArtifact.artifactId,
          artifactStage: existingArtifact.stage,
          isArtifact: true
        }
      });
    }

    logger.info(`Обновлен артефакт ${artifactId} проекта ${projectId}`);
    return NextResponse.json({ success: true, data: updatedArtifact }, { status: 200 });
  } catch (error) {
    logger.error(`Ошибка обновления артефакта ${artifactId} проекта ${projectId}:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при обновлении артефакта' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/:id/artifacts/:artifactId - Удалить артефакт проекта
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, artifactId: string } }
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
  const artifactId = params.artifactId;

  if (isNaN(projectId)) {
    return NextResponse.json(
      { success: false, error: 'Некорректный ID проекта' },
      { status: 400 }
    );
  }

  try {
    // Проверка, имеет ли пользователь доступ к проекту с правами владельца
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

    // Проверяем, существует ли артефакт в проекте
    const existingArtifact = await prisma.projectArtifact.findFirst({
      where: {
        projectId,
        id: artifactId
      },
      include: {
        file: true
      }
    });

    if (!existingArtifact) {
      return NextResponse.json(
        { success: false, error: 'Артефакт не найден в проекте' },
        { status: 404 }
      );
    }

    // Проверяем, связан ли артефакт с файлом
    if (existingArtifact.file) {
      // Обновляем файл, чтобы убрать связь с артефактом
      await prisma.file.update({
        where: { id: existingArtifact.file.id },
        data: {
          artifactId: null,
          artifactStage: null,
          isArtifact: false
        }
      });
    }

    // Удаляем артефакт проекта
    await prisma.projectArtifact.delete({
      where: {
        id: artifactId
      }
    });

    logger.info(`Удален артефакт ${artifactId} из проекта ${projectId}`);
    return NextResponse.json(
      { success: true, message: 'Артефакт успешно удален из проекта' },
      { status: 200 }
    );
  } catch (error) {
    logger.error(`Ошибка удаления артефакта ${artifactId} из проекта ${projectId}:`, error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при удалении артефакта' },
      { status: 500 }
    );
  }
}