import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '@/app/lib/auth'

const prisma = new PrismaClient()

// GET /api/tasks/:id - Получить задачу
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const taskId = parseInt(params.id)
    
    // Получаем задачу
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    })
    
    if (!task) {
      return NextResponse.json(
        { message: 'Задача не найдена' },
        { status: 404 }
      )
    }
    
    // Проверяем права доступа к проекту
    const token = request.cookies.get('token')?.value
    const { userId } = JSON.parse(
      Buffer.from(token!.split('.')[1], 'base64').toString()
    )
    
    const userHasAccess = await prisma.project.findFirst({
      where: {
        id: task.projectId,
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
    console.error('Ошибка получения задачи:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при получении задачи' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PATCH /api/tasks/:id - Обновить задачу
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const taskId = parseInt(params.id)
    const updates = await request.json()
    
    // Получаем текущую задачу
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    })
    
    if (!task) {
      return NextResponse.json(
        { message: 'Задача не найдена' },
        { status: 404 }
      )
    }
    
    // Проверяем права доступа к проекту
    const token = request.cookies.get('token')?.value
    const { userId } = JSON.parse(
      Buffer.from(token!.split('.')[1], 'base64').toString()
    )
    
    const userHasAccess = await prisma.project.findFirst({
      where: {
        id: task.projectId,
        users: { some: { id: userId } }
      }
    })
    
    if (!userHasAccess) {
      return NextResponse.json(
        { message: 'Доступ запрещён' },
        { status: 403 }
      )
    }
    
    // Обновляем задачу
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: updates.title || undefined,
        status: updates.status || undefined,
        priority: updates.priority || undefined,
        dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
      }
    })
    
    return NextResponse.json({ task: updatedTask }, { status: 200 })
  } catch (error) {
    console.error('Ошибка обновления задачи:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при обновлении задачи' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/tasks/:id - Удалить задачу
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const taskId = parseInt(params.id)
    
    // Получаем текущую задачу
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    })
    
    if (!task) {
      return NextResponse.json(
        { message: 'Задача не найдена' },
        { status: 404 }
      )
    }
    
    // Проверяем права доступа к проекту
    const token = request.cookies.get('token')?.value
    const { userId, role } = JSON.parse(
      Buffer.from(token!.split('.')[1], 'base64').toString()
    )
    
    const userHasAccess = await prisma.project.findFirst({
      where: {
        id: task.projectId,
        users: { some: { id: userId } }
      }
    })
    
    if (!userHasAccess) {
      return NextResponse.json(
        { message: 'Доступ запрещён' },
        { status: 403 }
      )
    }
    
    // Удаляем задачу
    await prisma.task.delete({
      where: { id: taskId }
    })
    
    return NextResponse.json(
      { message: 'Задача успешно удалена' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Ошибка удаления задачи:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при удалении задачи' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
