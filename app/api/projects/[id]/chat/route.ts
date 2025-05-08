import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '@/app/lib/auth'

const prisma = new PrismaClient()

// GET /api/projects/:id/chat - Получить историю чата проекта
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
    
    // Получаем сообщения чата
    const messages = await prisma.chatMessage.findMany({
      where: { projectId },
      orderBy: { timestamp: 'asc' }
    })
    
    return NextResponse.json({ messages }, { status: 200 })
  } catch (error) {
    console.error('Ошибка получения сообщений чата:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при получении сообщений чата' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/projects/:id/chat - Отправить сообщение в чат
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const projectId = parseInt(params.id)
    const { content } = await request.json()
    
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { message: 'Содержимое сообщения не может быть пустым' },
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
    
    // Создаем новое сообщение
    const message = await prisma.chatMessage.create({
      data: {
        projectId,
        userId,
        content,
      }
    })
    
    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при отправке сообщения' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
