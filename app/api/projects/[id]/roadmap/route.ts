// API-эндпоинт для работы с дорожной картой проекта
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:Projects:Roadmap');

interface Params {
  params: {
    id: string;
  };
}

/**
 * Получение дорожных карт проекта
 * 
 * GET /api/projects/:id/roadmap
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
    
    // Определяем параметры запроса
    const url = new URL(request.url);
    const includeTasks = url.searchParams.get('includeTasks') === 'true';
    const includeArtifacts = url.searchParams.get('includeArtifacts') === 'true';
    
    // Получаем дорожные карты проекта
    const roadmaps = await prisma.projectRoadmap.findMany({
      where: { projectId },
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
                        artifact: true
                      }
                    }
                  }
                }
              }
            },
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Проверяем, есть ли дорожные карты
    if (!roadmaps || roadmaps.length === 0) {
      return NextResponse.json(
        { success: false, message: "Roadmap not found" },
        { status: 404 }
      );
    }

    // Преобразуем структуру для фронтенда, чтобы она соответствовала ожиданиям
    const formattedRoadmaps = roadmaps.map(roadmap => {
      // Преобразуем структуру артефактов для задач
      const phases = roadmap.phases.map(phase => {
        const tasks = phase.tasks.map(task => {
          // Преобразуем формат artifactLinks
          const artifactLinks = task.artifactLinks.map(link => ({
            id: link.id,
            artifact: {
              id: link.projectArtifact.artifactId,
              name: link.projectArtifact.artifact?.enName || link.projectArtifact.artifactId
            }
          }));

          return {
            ...task,
            artifactLinks
          };
        });

        return {
          ...phase,
          tasks
        };
      });

      return {
        ...roadmap,
        phases
      };
    });

    // Возвращаем первую активную дорожную карту
    const activeRoadmap = formattedRoadmaps.find(r => r.isActive) || formattedRoadmaps[0];

    // Логируем для отладки
    logger.info(`Возвращается дорожная карта ${activeRoadmap.id} для проекта ${projectId}`);

    // Возвращаем результаты
    return NextResponse.json(activeRoadmap);
    
  } catch (error) {
    logger.error('Ошибка при получении дорожных карт проекта:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при получении дорожных карт' },
      { status: 500 }
    );
  }
}

/**
 * Создание дорожной карты проекта на основе фреймворка
 * 
 * POST /api/projects/:id/roadmap
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
    
    // Получаем данные из запроса
    const data = await request.json();
    
    // Валидируем данные
    if (!data.frameworkId) {
      return NextResponse.json(
        { success: false, error: 'Не указан ID фреймворка' },
        { status: 400 }
      );
    }
    
    // Проверяем, существует ли фреймворк
    const framework = await prisma.framework.findUnique({
      where: { id: data.frameworkId },
      include: {
        phases: {
          include: {
            tasks: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
    
    if (!framework) {
      return NextResponse.json(
        { success: false, error: 'Фреймворк не найден' },
        { status: 404 }
      );
    }
    
    // Создаем дорожную карту
    const roadmap = await prisma.projectRoadmap.create({
      data: {
        projectId,
        frameworkId: framework.id,
        name: data.name || `${framework.name} Roadmap`,
        description: data.description || framework.description,
        createdByUserId: authResult.userId,
        isActive: true
      }
    });
    
    logger.info(`Создана дорожная карта для проекта ${projectId} на основе фреймворка ${framework.name}`);
    
    // Создаем фазы для дорожной карты
    for (const phase of framework.phases) {
      // Создаем фазу
      const projectPhase = await prisma.projectPhase.create({
        data: {
          projectRoadmapId: roadmap.id,
          phaseId: phase.id,
          name: phase.name,
          ruName: phase.ruName,
          order: phase.order,
          status: 'NOT_STARTED',
          progress: 0
        }
      });
      
      logger.info(`Создана фаза ${phase.name} для дорожной карты ${roadmap.id}`);
      
      // Получаем задачи для этой фазы
      const tasks = phase.tasks || [];
      
      // Создаем задачи для фазы
      for (const task of tasks) {
        if (task.isRequired) {
          // Создаем задачу
          const projectTask = await prisma.projectTask.create({
            data: {
              projectPhaseId: projectPhase.id,
              frameworkTaskId: task.id,
              name: task.name,
              ruName: task.ruName,
              description: task.description,
              ruDescription: task.ruDescription,
              status: 'TODO',
              priority: 2, // Средний приоритет по умолчанию
              estimatedHours: task.estimatedHours,
              acceptanceCriteria: task.acceptanceCriteria,
              dependsOn: task.dependsOn,
              isCustom: false
            }
          });
          
          logger.info(`Создана задача ${task.name} для фазы ${phase.name} дорожной карты ${roadmap.id}`);
          
          // Связываем задачу с артефактами, если они указаны и существуют в проекте
          if (task.artifactIds && task.artifactIds.length > 0) {
            // Находим существующие артефакты проекта
            const projectArtifacts = await prisma.projectArtifact.findMany({
              where: {
                projectId,
                artifactId: {
                  in: task.artifactIds
                }
              }
            });
            
            // Создаем связи между задачей и артефактами
            for (const artifact of projectArtifacts) {
              await prisma.projectTaskArtifact.create({
                data: {
                  projectTaskId: projectTask.id,
                  projectArtifactId: artifact.id,
                  status: 'NOT_STARTED',
                  isRequired: true
                }
              });
              
              logger.info(`Связана задача ${task.name} с артефактом ${artifact.artifactId}`);
            }
            
            // Если артефакты не существуют в проекте, но указаны в задаче, создаем их
            for (const artifactId of task.artifactIds) {
              const exists = projectArtifacts.some(a => a.artifactId === artifactId);
              
              if (!exists) {
                // Проверяем, существует ли артефакт в каталоге
                const catalogArtifact = await prisma.artifactCatalog.findUnique({
                  where: { id: artifactId }
                });
                
                if (catalogArtifact) {
                  // Определяем стадию артефакта на основе фазы
                  let stage: any = 'INITIATION_DISCOVERY';
                  
                  if (phase.order > 1 && phase.order <= 2) {
                    stage = 'ANALYSIS_MODELING';
                  } else if (phase.order > 2 && phase.order <= 3) {
                    stage = 'SOLUTION_DESIGN_PLANNING';
                  } else if (phase.order > 3) {
                    stage = 'MONITORING_EVALUATION';
                  }
                  
                  // Определяем формат артефакта на основе его ID или формата в каталоге
                  let format: any = 'OTHER';
                  
                  if (catalogArtifact.format.includes('docx') || catalogArtifact.format.includes('doc')) {
                    format = 'DOCX';
                  } else if (catalogArtifact.format.includes('xlsx') || catalogArtifact.format.includes('xls')) {
                    format = 'XLSX';
                  } else if (catalogArtifact.format.includes('pdf')) {
                    format = 'PDF';
                  } else if (catalogArtifact.format.includes('bpmn')) {
                    format = 'BPMN';
                  } else if (catalogArtifact.format.includes('png') || catalogArtifact.format.includes('jpg') || catalogArtifact.format.includes('jpeg')) {
                    format = 'PNG';
                  }
                  
                  // Создаем артефакт в проекте
                  const projectArtifact = await prisma.projectArtifact.create({
                    data: {
                      projectId,
                      artifactId,
                      status: 'NOT_STARTED',
                      stage,
                      format,
                      version: 1
                    }
                  });
                  
                  logger.info(`Создан артефакт ${artifactId} для проекта ${projectId}`);
                  
                  // Связываем задачу с артефактом
                  await prisma.projectTaskArtifact.create({
                    data: {
                      projectTaskId: projectTask.id,
                      projectArtifactId: projectArtifact.id,
                      status: 'NOT_STARTED',
                      isRequired: true
                    }
                  });
                  
                  logger.info(`Связана задача ${task.name} с новым артефактом ${artifactId}`);
                }
              }
            }
          }
        }
      }
    }
    
    // Получаем созданную дорожную карту со всеми связями
    const createdRoadmap = await prisma.projectRoadmap.findUnique({
      where: { id: roadmap.id },
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
                        artifact: true
                      }
                    }
                  }
                }
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
    
    // Возвращаем созданную дорожную карту
    return NextResponse.json({
      success: true,
      data: createdRoadmap
    }, { status: 201 });
    
  } catch (error) {
    logger.error('Ошибка при создании дорожной карты:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при создании дорожной карты' },
      { status: 500 }
    );
  }
}