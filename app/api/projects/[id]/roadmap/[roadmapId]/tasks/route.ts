// API-эндпоинт для работы с задачами дорожной карты проекта
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:Projects:Roadmap:Tasks');

interface Params {
  params: {
    id: string;
    roadmapId: string;
  };
}

/**
 * Добавление задачи в дорожную карту проекта
 * 
 * POST /api/projects/:id/roadmap/:roadmapId/tasks
 */
export async function POST(request: NextRequest, { params }: Params) {
  // Проверяем аутентификацию пользователя
  const authResult = await authMiddleware(request);
  if (!authResult.success) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: 401 }
    );
  }

  try {
    const projectId = parseInt(params.id);
    const roadmapId = params.roadmapId;
    
    // Проверяем, что проект существует и пользователь имеет к нему доступ
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        users: {
          some: {
            id: authResult.userId
          }
        }
      }
    });
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Проект не найден или у вас нет к нему доступа' },
        { status: 404 }
      );
    }
    
    // Проверяем, что дорожная карта существует
    const existingRoadmap = await prisma.projectRoadmap.findFirst({
      where: {
        id: roadmapId,
        projectId
      },
      include: {
        phases: true
      }
    });
    
    if (!existingRoadmap) {
      return NextResponse.json(
        { success: false, error: 'Дорожная карта не найдена' },
        { status: 404 }
      );
    }
    
    // Получаем данные из запроса
    const data = await request.json();
    
    // Валидируем данные
    if (!data.projectPhaseId || !data.name) {
      return NextResponse.json(
        { success: false, error: 'Не указаны обязательные поля (projectPhaseId, name)' },
        { status: 400 }
      );
    }
    
    // Проверяем, что фаза существует и принадлежит данной дорожной карте
    const phaseExists = existingRoadmap.phases.some(phase => phase.id === data.projectPhaseId);
    
    if (!phaseExists) {
      return NextResponse.json(
        { success: false, error: 'Фаза не найдена в этой дорожной карте' },
        { status: 404 }
      );
    }
    
    // Создаем новую задачу
    const task = await prisma.projectTask.create({
      data: {
        projectPhaseId: data.projectPhaseId,
        frameworkTaskId: data.frameworkTaskId || null,
        name: data.name,
        ruName: data.ruName || data.name,
        description: data.description || null,
        ruDescription: data.ruDescription || null,
        status: data.status || 'TODO',
        priority: data.priority || 2,
        estimatedHours: data.estimatedHours || null,
        actualHours: data.actualHours || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assignedToUserId: data.assignedToUserId || null,
        acceptanceCriteria: data.acceptanceCriteria || null,
        isCustom: true,
        dependsOn: data.dependsOn || [],
        notes: data.notes || null
      }
    });
    
    logger.info(`Создана новая задача ${task.name} (${task.id}) в дорожной карте ${roadmapId}`);
    
    // Если указаны артефакты, связываем задачу с ними
    if (data.artifactIds && Array.isArray(data.artifactIds)) {
      for (const artifactId of data.artifactIds) {
        // Проверяем, что артефакт существует и принадлежит проекту
        const projectArtifact = await prisma.projectArtifact.findFirst({
          where: {
            id: artifactId,
            projectId
          }
        });
        
        if (projectArtifact) {
          // Создаем связь между задачей и артефактом
          await prisma.projectTaskArtifact.create({
            data: {
              projectTaskId: task.id,
              projectArtifactId: artifactId,
              status: 'NOT_STARTED',
              isRequired: true
            }
          });
          
          logger.info(`Связана задача ${task.id} с артефактом ${artifactId}`);
        }
      }
    }
    
    // Получаем созданную задачу со всеми связями
    const createdTask = await prisma.projectTask.findUnique({
      where: { id: task.id },
      include: {
        artifactLinks: {
          include: {
            projectArtifact: {
              include: {
                artifact: true
              }
            }
          }
        }
      }
    });
    
    // Возвращаем созданную задачу
    return NextResponse.json({
      success: true,
      data: createdTask
    }, { status: 201 });
    
  } catch (error) {
    logger.error('Ошибка при создании задачи:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при создании задачи' },
      { status: 500 }
    );
  }
}

/**
 * Получение задач дорожной карты
 * 
 * GET /api/projects/:id/roadmap/:roadmapId/tasks
 */
export async function GET(request: NextRequest, { params }: Params) {
  // Проверяем аутентификацию пользователя
  const authResult = await authMiddleware(request);
  if (!authResult.success) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: 401 }
    );
  }

  try {
    const projectId = parseInt(params.id);
    const roadmapId = params.roadmapId;
    
    // Проверяем, что проект существует и пользователь имеет к нему доступ
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        users: {
          some: {
            id: authResult.userId
          }
        }
      }
    });
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Проект не найден или у вас нет к нему доступа' },
        { status: 404 }
      );
    }
    
    // Получаем фазы дорожной карты
    const phases = await prisma.projectPhase.findMany({
      where: {
        projectRoadmapId: roadmapId
      }
    });
    
    if (phases.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Дорожная карта не найдена или у нее нет фаз' },
        { status: 404 }
      );
    }
    
    // Получаем задачи всех фаз дорожной карты
    const phaseIds = phases.map(phase => phase.id);
    
    const tasks = await prisma.projectTask.findMany({
      where: {
        projectPhaseId: {
          in: phaseIds
        }
      },
      include: {
        artifactLinks: {
          include: {
            projectArtifact: {
              include: {
                artifact: true
              }
            }
          }
        },
        projectPhase: true,
        frameworkTask: true
      },
      orderBy: [
        {
          projectPhase: {
            order: 'asc'
          }
        },
        {
          createdAt: 'asc'
        }
      ]
    });
    
    // Возвращаем задачи дорожной карты
    return NextResponse.json({
      success: true,
      data: tasks
    });
    
  } catch (error) {
    logger.error('Ошибка при получении задач дорожной карты:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при получении задач' },
      { status: 500 }
    );
  }
}