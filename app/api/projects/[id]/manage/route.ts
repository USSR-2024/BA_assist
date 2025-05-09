import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, checkRole } from '@/app/lib/auth'

const prisma = new PrismaClient()

// POST /api/projects/:id/manage - Управление статусом проекта (закрытие, удаление)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Некорректный ID проекта' },
        { status: 400 }
      )
    }

    const { action } = await request.json()
    
    // Проверка наличия обязательных полей
    if (!action || !['close', 'delete', 'reopen'].includes(action)) {
      return NextResponse.json(
        { message: 'Требуется корректное действие (close, delete или reopen)' },
        { status: 400 }
      )
    }

    // Проверка, существует ли проект
    const project = await prisma.project.findUnique({
      where: { id },
      include: { 
        users: { select: { id: true, email: true, role: true } } 
      }
    })

    if (!project) {
      return NextResponse.json(
        { message: 'Проект не найден' },
        { status: 404 }
      )
    }

    // Проверка, что пользователь является владельцем проекта
    const token = request.cookies.get('token')?.value
    const { userId } = JSON.parse(
      Buffer.from(token!.split('.')[1], 'base64').toString()
    )

    // Проверка, что пользователь является создателем проекта
    if (project.ownerId !== userId) {
      return NextResponse.json(
        { message: 'Только создатель проекта может изменить его статус' },
        { status: 403 }
      )
    }

    // Convert action to valid ProjectStatus values
    let newStatus
    let message

    switch(action) {
      case 'close':
        // Use ARCHIVED as a temporary solution until migration is completed
        newStatus = 'ARCHIVED' // Should be CLOSED after migration
        message = 'Проект успешно закрыт'
        break
      case 'delete':
        // Use ARCHIVED as a temporary solution until migration is completed
        newStatus = 'ARCHIVED' // Should be DELETED after migration
        break
      case 'reopen':
        newStatus = 'ACTIVE'
        message = 'Проект успешно переоткрыт'
        break
    }

    // Обновление статуса проекта
    const updatedProject = await prisma.project.update({
      where: { id },
      data: { status: newStatus }
    })

    return NextResponse.json(
      { 
        message,
        project: {
          id: updatedProject.id,
          title: updatedProject.title,
          status: updatedProject.status
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Ошибка управления проектом:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при управлении проектом' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}