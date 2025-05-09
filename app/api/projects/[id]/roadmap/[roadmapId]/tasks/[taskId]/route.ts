// API-эндпоинт для работы с конкретной задачей дорожной карты проекта
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:Projects:Roadmap:Tasks:ID');

interface Params {
  params: {
    id: string;
    roadmapId: string;
    taskId: string;
  };
}

/**
 * Получение информации о конкретной задаче
 * 
 * GET /api/projects/:id/roadmap/:roadmapId/tasks/:taskId
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
    const taskId = params.taskId;
    
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
    
    // Получаем задачу с проверкой, что она принадлежит указанной дорожной карте
    const task = await prisma.projectTask.findFirst({
      where: {
        id: taskId,
        projectPhase: {
          projectRoadmapId: params.roadmapId
        }
      },
      include: {
        artifactLinks: {
          include: {
            projectArtifact: {
              include: {
                artifact: true,
                file: true
              }
            }
          }
        },
        projectPhase: {
          include: {
            phase: true
          }
        },
        frameworkTask: true
      }
    });
    
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Задача не найдена' },
        { status: 404 }
      );
    }
    
    // Возвращаем задачу
    return NextResponse.json({
      success: true,
      data: task
    });
    
  } catch (error) {
    logger.error('Ошибка при получении задачи:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при получении задачи' },
      { status: 500 }
    );
  }
}

/**
 * Обновление задачи
 * 
 * PUT /api/projects/:id/roadmap/:roadmapId/tasks/:taskId
 */
export async function PUT(request: NextRequest, { params }: Params) {
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
    const taskId = params.taskId;
    
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
    
    // Проверяем, что задача существует и принадлежит указанной дорожной карте
    const existingTask = await prisma.projectTask.findFirst({
      where: {
        id: taskId,
        projectPhase: {
          projectRoadmapId: params.roadmapId
        }
      },
      include: {
        artifactLinks: true,
        projectPhase: true
      }
    });
    
    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Задача не найдена' },
        { status: 404 }
      );
    }
    
    // Получаем данные из запроса
    const data = await request.json();
    
    // Если указана новая фаза, проверяем, что она принадлежит той же дорожной карте
    if (data.projectPhaseId && data.projectPhaseId !== existingTask.projectPhaseId) {
      const phaseExists = await prisma.projectPhase.findFirst({
        where: {
          id: data.projectPhaseId,
          projectRoadmapId: params.roadmapId
        }
      });
      
      if (!phaseExists) {
        return NextResponse.json(
          { success: false, error: 'Указанная фаза не найдена в этой дорожной карте' },
          { status: 400 }
        );
      }
    }
    
    // Обновляем задачу
    const updatedTask = await prisma.projectTask.update({
      where: { id: taskId },
      data: {
        projectPhaseId: data.projectPhaseId || undefined,
        name: data.name || undefined,
        ruName: data.ruName || undefined,
        description: data.description !== undefined ? data.description : undefined,
        ruDescription: data.ruDescription !== undefined ? data.ruDescription : undefined,
        status: data.status || undefined,
        priority: data.priority || undefined,
        estimatedHours: data.estimatedHours !== undefined ? data.estimatedHours : undefined,
        actualHours: data.actualHours !== undefined ? data.actualHours : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        assignedToUserId: data.assignedToUserId !== undefined ? data.assignedToUserId : undefined,
        acceptanceCriteria: data.acceptanceCriteria !== undefined ? data.acceptanceCriteria : undefined,
        dependsOn: data.dependsOn || undefined,
        notes: data.notes !== undefined ? data.notes : undefined
      }
    });
    
    logger.info(`Обновлена задача ${taskId} в дорожной карте ${params.roadmapId}`);
    
    // Если указаны артефакты, обновляем связи
    if (data.artifactIds && Array.isArray(data.artifactIds)) {
      // Получаем текущие связи задачи с артефактами
      const existingLinks = existingTask.artifactLinks.map(link => link.projectArtifactId);
      
      // Определяем артефакты для добавления и удаления
      const toAdd = data.artifactIds.filter(id => !existingLinks.includes(id));
      const toRemove = existingLinks.filter(id => !data.artifactIds.includes(id));
      
      // Удаляем лишние связи
      if (toRemove.length > 0) {
        await prisma.projectTaskArtifact.deleteMany({
          where: {
            projectTaskId: taskId,
            projectArtifactId: {
              in: toRemove
            }
          }
        });
        
        logger.info(`Удалены связи задачи ${taskId} с артефактами: ${toRemove.join(', ')}`);
      }
      
      // Добавляем новые связи
      for (const artifactId of toAdd) {
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
              projectTaskId: taskId,
              projectArtifactId: artifactId,
              status: 'NOT_STARTED',
              isRequired: true
            }
          });
          
          logger.info(`Добавлена связь задачи ${taskId} с артефактом ${artifactId}`);
        }
      }
    }
    
    // Получаем обновленную задачу со всеми связями
    const task = await prisma.projectTask.findUnique({
      where: { id: taskId },
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
      }
    });
    
    // Возвращаем обновленную задачу
    return NextResponse.json({
      success: true,
      data: task
    });
    
  } catch (error) {
    logger.error('Ошибка при обновлении задачи:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при обновлении задачи' },
      { status: 500 }
    );
  }
}

/**
 * Удаление задачи
 * 
 * DELETE /api/projects/:id/roadmap/:roadmapId/tasks/:taskId
 */
export async function DELETE(request: NextRequest, { params }: Params) {
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
    const taskId = params.taskId;
    
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
    
    // Проверяем, что задача существует и принадлежит указанной дорожной карте
    const existingTask = await prisma.projectTask.findFirst({
      where: {
        id: taskId,
        projectPhase: {
          projectRoadmapId: params.roadmapId
        }
      }
    });
    
    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Задача не найдена' },
        { status: 404 }
      );
    }
    
    // Удаляем задачу
    await prisma.projectTask.delete({
      where: { id: taskId }
    });
    
    logger.info(`Удалена задача ${taskId} из дорожной карты ${params.roadmapId}`);
    
    // Возвращаем успешный ответ
    return NextResponse.json({
      success: true,
      message: 'Задача успешно удалена'
    });
    
  } catch (error) {
    logger.error('Ошибка при удалении задачи:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при удалении задачи' },
      { status: 500 }
    );
  }
}