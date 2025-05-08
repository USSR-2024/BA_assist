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
    
    // Получаем задачи проекта
    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: [
        { priority: 'desc' }
      ]
    })
    
    return NextResponse.json({ tasks }, { status: 200 })
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
