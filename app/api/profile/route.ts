import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '@/app/lib/auth'

const prisma = new PrismaClient()

// GET /api/profile - Получить профиль пользователя
export async function GET(request: NextRequest) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    // Получаем ID пользователя из токена
    const token = request.cookies.get('token')?.value
    const { userId } = JSON.parse(
      Buffer.from(token!.split('.')[1], 'base64').toString()
    )
    
    // Получаем данные пользователя из базы данных
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        isVerified: true
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { message: 'Пользователь не найден' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error('Ошибка получения профиля:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при получении профиля' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
