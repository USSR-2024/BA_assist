import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '@/app/lib/auth'
import { createLogger } from '@/lib/logger'

const prisma = new PrismaClient()
const logger = createLogger('API:RoadmapTasks')

// GET /api/roadmap-tasks/:id - Получить задачу дорожной карты
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const taskId = params.id
    
    // Получаем задачу дорожной карты
    const task = await prisma.projectTask.findUnique({
      where: { id: taskId },
      include: { 
        projectPhase: {
          include: {
            projectRoadmap: {
              include: {
                project: true
              }
            }
          }
        },
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
    })
    
    if (!task) {
      return NextResponse.json(
        { message: 'Задача не найдена' },
        { status: 404 }
      )
    }
    
    // Получаем проект через связи задача -> фаза -> дорожная карта -> проект
    const projectId = task.projectPhase.projectRoadmap.projectId
    
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
        { message: 'Доступ запрещён' },
        { status: 403 }
      )
    }
    
    return NextResponse.json({ task }, { status: 200 })
  } catch (error) {
    logger.error('Ошибка получения задачи дорожной карты:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при получении задачи' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PATCH /api/roadmap-tasks/:id - Обновить задачу дорожной карты
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const taskId = params.id
    const updates = await request.json()
    
    // Получаем текущую задачу
    const task = await prisma.projectTask.findUnique({
      where: { id: taskId },
      include: { 
        projectPhase: {
          include: {
            projectRoadmap: {
              include: {
                project: true
              }
            }
          }
        } 
      }
    })
    
    if (!task) {
      return NextResponse.json(
        { message: 'Задача не найдена' },
        { status: 404 }
      )
    }
    
    // Получаем проект через связи задача -> фаза -> дорожная карта -> проект
    const projectId = task.projectPhase.projectRoadmap.projectId
    
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
        { message: 'Доступ запрещён' },
        { status: 403 }
      )
    }
    
    // Обновляем задачу дорожной карты
    const updatedTask = await prisma.projectTask.update({
      where: { id: taskId },
      data: {
        name: updates.title || undefined,
        ruName: updates.ruName || updates.title || undefined,
        status: updates.status || undefined,
        priority: updates.priority || undefined,
        dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
        estimatedHours: updates.estimatedHours || undefined,
        actualHours: updates.actualHours || undefined,
        assignedToUserId: updates.assignedToUserId || undefined,
        description: updates.description || undefined,
        ruDescription: updates.ruDescription || updates.description || undefined
      }
    })
    
    // Если это была последняя задача в фазе, обновляем статус фазы
    if (updates.status === 'DONE') {
      const phaseId = task.projectPhaseId
      const tasksInPhase = await prisma.projectTask.findMany({
        where: { 
          projectPhaseId: phaseId,
          NOT: { id: taskId }
        }
      })
      
      const allDone = tasksInPhase.every(t => t.status === 'DONE')
      
      if (allDone) {
        await prisma.projectPhase.update({
          where: { id: phaseId },
          data: { 
            status: 'COMPLETED',
            progress: 100
          }
        })
      } else {
        // Обновляем прогресс фазы
        const allTasks = [...tasksInPhase, updatedTask]
        const completedTasks = allTasks.filter(t => t.status === 'DONE').length
        const progressPercent = Math.round((completedTasks / allTasks.length) * 100)
        
        await prisma.projectPhase.update({
          where: { id: phaseId },
          data: { 
            status: 'IN_PROGRESS',
            progress: progressPercent 
          }
        })
      }
    }
    
    return NextResponse.json({ task: updatedTask }, { status: 200 })
  } catch (error) {
    logger.error('Ошибка обновления задачи дорожной карты:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при обновлении задачи' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}