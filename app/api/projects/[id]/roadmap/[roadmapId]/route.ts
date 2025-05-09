// API-эндпоинт для работы с конкретной дорожной картой проекта
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:Projects:Roadmap:ID');

interface Params {
  params: {
    id: string;
    roadmapId: string;
  };
}

/**
 * Получение конкретной дорожной карты проекта
 * 
 * GET /api/projects/:id/roadmap/:roadmapId
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
    
    // Получаем дорожную карту
    const roadmap = await prisma.projectRoadmap.findFirst({
      where: {
        id: roadmapId,
        projectId
      },
      include: {
        framework: true,
        phases: {
          include: {
            tasks: {
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
                frameworkTask: true
              },
              orderBy: {
                createdAt: 'asc'
              }
            },
            phase: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
    
    if (!roadmap) {
      return NextResponse.json(
        { success: false, error: 'Дорожная карта не найдена' },
        { status: 404 }
      );
    }
    
    // Возвращаем дорожную карту
    return NextResponse.json({
      success: true,
      data: roadmap
    });
    
  } catch (error) {
    logger.error('Ошибка при получении дорожной карты:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при получении дорожной карты' },
      { status: 500 }
    );
  }
}

/**
 * Обновление дорожной карты проекта
 * 
 * PUT /api/projects/:id/roadmap/:roadmapId
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
    
    // Обновляем дорожную карту
    const updatedRoadmap = await prisma.projectRoadmap.update({
      where: { id: roadmapId },
      data: {
        name: data.name !== undefined ? data.name : existingRoadmap.name,
        description: data.description !== undefined ? data.description : existingRoadmap.description,
        isActive: data.isActive !== undefined ? data.isActive : existingRoadmap.isActive
      }
    });
    
    logger.info(`Обновлена дорожная карта ${roadmapId} для проекта ${projectId}`);
    
    // Если переданы данные для обновления фаз
    if (data.phases && Array.isArray(data.phases)) {
      for (const phaseData of data.phases) {
        if (!phaseData.id) continue;
        
        // Обновляем фазу
        await prisma.projectPhase.update({
          where: { id: phaseData.id },
          data: {
            name: phaseData.name,
            ruName: phaseData.ruName,
            order: phaseData.order,
            startDate: phaseData.startDate ? new Date(phaseData.startDate) : null,
            endDate: phaseData.endDate ? new Date(phaseData.endDate) : null,
            status: phaseData.status,
            progress: phaseData.progress !== undefined ? phaseData.progress : undefined
          }
        });
        
        logger.info(`Обновлена фаза ${phaseData.id} дорожной карты ${roadmapId}`);
      }
    }
    
    // Возвращаем обновленную дорожную карту
    return NextResponse.json({
      success: true,
      data: updatedRoadmap
    });
    
  } catch (error) {
    logger.error('Ошибка при обновлении дорожной карты:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при обновлении дорожной карты' },
      { status: 500 }
    );
  }
}

/**
 * Удаление дорожной карты проекта
 * 
 * DELETE /api/projects/:id/roadmap/:roadmapId
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
      }
    });
    
    if (!existingRoadmap) {
      return NextResponse.json(
        { success: false, error: 'Дорожная карта не найдена' },
        { status: 404 }
      );
    }
    
    // Удаляем дорожную карту с каскадным удалением всех связанных данных:
    // фазы, задачи, связи с артефактами (но не сами артефакты)
    await prisma.projectRoadmap.delete({
      where: { id: roadmapId }
    });
    
    logger.info(`Удалена дорожная карта ${roadmapId} для проекта ${projectId}`);
    
    // Возвращаем успешный ответ
    return NextResponse.json({
      success: true,
      message: 'Дорожная карта успешно удалена'
    });
    
  } catch (error) {
    logger.error('Ошибка при удалении дорожной карты:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при удалении дорожной карты' },
      { status: 500 }
    );
  }
}