import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { validateRequest } from '@/lib/validators';

const logger = createLogger('API:Projects');

// Правила валидации для создания проекта
const createProjectRules = [
  { field: 'title', required: true, minLength: 1, errorMessage: 'Название проекта обязательно' },
  { field: 'description', required: false, maxLength: 1000, errorMessage: 'Описание проекта не должно превышать 1000 символов' }
];

// GET /api/projects - Получить список проектов
export async function GET(request: NextRequest) {
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

  const url = new URL(request.url);
  const status = url.searchParams.get('status') as 'ACTIVE' | 'ARCHIVED' | null;

  try {
    const userId = authResult.userId;

    const whereClause = status 
      ? { 
          users: { some: { id: userId } },
          status 
        } 
      : { 
          users: { some: { id: userId } } 
        };

    const projects = await prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            files: true,
            tasks: true
          }
        }
      }
    });

    logger.info(`Получено ${projects.length} проектов для пользователя ${userId}`);
    return NextResponse.json({ success: true, data: projects }, { status: 200 });
  } catch (error) {
    logger.error('Ошибка получения проектов:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при получении проектов' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/projects - Создать новый проект
export async function POST(request: NextRequest) {
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

  try {
    const data = await request.json();
    
    // Валидация базовых полей
    if (!data.title || data.title.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Название проекта обязательно' },
        { status: 400 }
      );
    }
    
    const userId = authResult.userId;
    
    logger.info(`Создание нового проекта "${data.title}" пользователем ${userId}`);
    
    // Подготовка данных для создания проекта
    const projectData: any = {
      title: data.title,
      description: data.description,
      ownerId: userId,
      users: {
        connect: { id: userId }
      }
    };
    
    // Добавляем дополнительные поля из мини-интервью, если они есть
    const interviewFields = [
      'sponsor', 'businessOwner', 'businessNeed', 'successMetrics', 
      'scopeAreas', 'outOfScope', 'deliverables', 'constraints',
      'durationBucket', 'coreTeamSize', 'processMaturity', 'preferredStyle',
      'riskTolerance', 'initialArtifacts', 'storageLinks', 'notes',
      'framework', 'storageRules'
    ];
    
    // Добавляем каждое поле, если оно определено
    interviewFields.forEach(field => {
      if (data[field] !== undefined) {
        projectData[field] = data[field];
      }
    });
    
    // Обработка даты, если она есть
    if (data.targetDate) {
      projectData.targetDate = new Date(data.targetDate);
    }
    
    // Обработка дорожной карты, если она есть
    if (data.roadmap) {
      projectData.roadmap = data.roadmap;
    }
    
    // Создаем проект
    const project = await prisma.project.create({
      data: projectData
    });

    logger.info(`Проект успешно создан с ID: ${project.id}`);
    
    // Возвращаем и объект project в поле data и напрямую в корне ответа для обратной совместимости
    return NextResponse.json({ 
      success: true, 
      data: project, 
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt,
      ownerId: project.ownerId,
      summary: project.summary
    }, { status: 201 });
  } catch (error) {
    logger.error('Ошибка создания проекта:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при создании проекта' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}