import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '@/app/lib/auth'

const prisma = new PrismaClient()

// GET /api/projects/:id/tasks - Получить задачи проекта
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const projectId = parseInt(params.id)
    
    // Проверяем права доступа к проекту
    const token = request.cookies.get('token')?.value
    const { userId } = JSON.parse(
      Buffer.from(token!.split('.')[1], 'base64').toString()
    )
    
    const userHasAccess = await prisma.project.findFirst({
      where: {
        id: projectId,
        users: { some: { id: userId } }
      }
    })
    
    if (!userHasAccess) {
      return NextResponse.json(
        { message: 'Проект не найден или доступ запрещён' },
        { status: 403 }
      )
    }
    
    // Получаем обычные задачи проекта
    const standardTasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: [
        { priority: 'desc' }
      ]
    })

    // Получаем задачи из дорожной карты проекта
    const projectRoadmaps = await prisma.projectRoadmap.findMany({
      where: {
        projectId,
        isActive: true
      },
      include: {
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
            }
          }
        }
      }
    })

    // Преобразуем задачи дорожной карты в формат, совместимый с обычными задачами
    let roadmapTasks = []

    if (projectRoadmaps.length > 0) {
      const flattenedTasks = []

      // Извлекаем все задачи из всех фаз всех дорожных карт
      for (const roadmap of projectRoadmaps) {
        for (const phase of roadmap.phases) {
          for (const task of phase.tasks) {
            flattenedTasks.push({
              ...task,
              phaseName: phase.name,
              phaseId: phase.id,
              roadmapId: roadmap.id
            })
          }
        }
      }

      // Преобразуем формат задач дорожной карты в формат, совместимый с обычными задачами
      roadmapTasks = flattenedTasks.map(task => ({
        id: task.id,
        title: task.ruName || task.name || 'Без названия',
        status: task.status || 'TODO',
        priority: task.priority || 2,
        dueDate: task.dueDate,
        description: task.ruDescription || task.description || '',
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        assignedToUserId: task.assignedToUserId,
        // Дополнительные поля для задач дорожной карты
        phaseId: task.phaseId,
        phaseName: task.phaseName,
        roadmapId: task.roadmapId,
        frameworkTaskId: task.frameworkTaskId,
        isRoadmapTask: true,
        artifactLinks: task.artifactLinks ? task.artifactLinks.filter(link =>
          link && link.projectArtifact && link.projectArtifact.artifact
        ).map(link => ({
          id: link.id,
          artifact: {
            id: link.projectArtifact.artifactId,
            name: link.projectArtifact.artifact ? link.projectArtifact.artifact.enName : 'Неизвестный артефакт'
          }
        })) : []
      }))
    }

    // Преобразуем обычные задачи, добавляя признак, что это не задача дорожной карты
    const formattedStandardTasks = standardTasks.map(task => ({
      ...task,
      isRoadmapTask: false
    }))

    // Объединяем два массива задач
    const allTasks = [...formattedStandardTasks, ...roadmapTasks]

    return NextResponse.json({ tasks: allTasks }, { status: 200 })
  } catch (error) {
    console.error('Ошибка получения задач:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при получении задач' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/projects/:id/tasks - Создать новую задачу
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const projectId = parseInt(params.id)
    const { title, priority, dueDate } = await request.json()
    
    if (!title) {
      return NextResponse.json(
        { message: 'Название задачи обязательно' },
        { status: 400 }
      )
    }
    
    // Проверяем права доступа к проекту
    const token = request.cookies.get('token')?.value
    const { userId } = JSON.parse(
      Buffer.from(token!.split('.')[1], 'base64').toString()
    )
    
    const userHasAccess = await prisma.project.findFirst({
      where: {
        id: projectId,
        users: { some: { id: userId } }
      }
    })
    
    if (!userHasAccess) {
      return NextResponse.json(
        { message: 'Проект не найден или доступ запрещён' },
        { status: 403 }
      )
    }
    
    // Создаем новую задачу
    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        priority: priority || 2, // По умолчанию средний приоритет
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'TODO',
      }
    })
    
    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания задачи:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при создании задачи' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
