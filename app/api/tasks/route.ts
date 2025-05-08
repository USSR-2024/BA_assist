import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '@/app/lib/auth'

const prisma = new PrismaClient()

// POST /api/tasks - Создать новую задачу
export async function POST(request: NextRequest) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const { projectId, title, priority, dueDate } = await request.json()

    // Проверка наличия обязательных полей
    if (!projectId || !title) {
      return NextResponse.json(
        { message: 'ID проекта и название задачи обязательны' },
        { status: 400 }
      )
    }

    // Проверка прав доступа пользователя к проекту
    const token = request.cookies.get('token')?.value
    const { userId, role } = JSON.parse(
      Buffer.from(token!.split('.')[1], 'base64').toString()
    )

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        users: { some: { id: userId } }
      }
    })

    if (!project) {
      return NextResponse.json(
        { message: 'Проект не найден или доступ запрещён' },
        { status: 403 }
      )
    }

    // Guest не может создавать задачи
    if (role === 'GUEST') {
      return NextResponse.json(
        { message: 'У вас недостаточно прав для создания задач' },
        { status: 403 }
      )
    }

    // Создание задачи
    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        priority: priority || 2, // Средний приоритет по умолчанию (1-3)
        dueDate: dueDate ? new Date(dueDate) : null
      }
    })

    return NextResponse.json(task, { status: 201 })
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