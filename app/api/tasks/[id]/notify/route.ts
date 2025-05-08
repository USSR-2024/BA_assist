import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '@/app/lib/auth'
import emailService from '@/app/services/email'

const prisma = new PrismaClient()

// POST /api/tasks/:id/notify - Отправить уведомление о задаче
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const taskId = parseInt(params.id)
    const { userEmail } = await request.json()
    
    if (!userEmail) {
      return NextResponse.json(
        { message: 'Email пользователя обязателен' },
        { status: 400 }
      )
    }
    
    // Получаем данные задачи с проектом
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
    
    // Проверяем, существует ли пользователь с таким email
    const notifyUser = await prisma.user.findUnique({
      where: { email: userEmail }
    })
    
    if (!notifyUser) {
      return NextResponse.json(
        { message: 'Пользователь с указанным email не найден' },
        { status: 404 }
      )
    }
    
    // Проверяем, имеет ли пользователь доступ к проекту
    const userInProject = await prisma.project.findFirst({
      where: {
        id: task.projectId,
        users: { some: { id: notifyUser.id } }
      }
    })
    
    if (!userInProject) {
      return NextResponse.json(
        { message: 'Пользователь не является участником проекта' },
        { status: 400 }
      )
    }
    
    // Формируем ссылку на задачу
    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const taskLink = `${appUrl}/dashboard/projects/${task.projectId}/tasks?task=${taskId}`
    
    // Отправляем уведомление о задаче
    await emailService.sendTaskNotificationEmail(
      userEmail,
      task.title,
      task.project.title,
      taskLink,
      task.priority
    )
    
    return NextResponse.json(
      { message: 'Уведомление о задаче успешно отправлено' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Ошибка отправки уведомления:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при отправке уведомления' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
