import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import emailService from '@/app/services/email'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST /api/auth/forgot-password - Запрос сброса пароля
export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email обязателен' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли пользователь с таким email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Не сообщаем, существует ли пользователь (для безопасности)
    if (!user) {
      return NextResponse.json(
        { message: 'Если указанный email зарегистрирован, инструкции по сбросу пароля будут отправлены.' },
        { status: 200 }
      )
    }

    // Создаем токен сброса пароля
    const resetToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        type: 'password-reset' 
      },
      JWT_SECRET,
      { expiresIn: '1h' } // Срок действия токена - 1 час
    )

    // Отправляем письмо для сброса пароля
    await emailService.sendPasswordResetEmail(email, resetToken)

    return NextResponse.json(
      { message: 'Инструкции по сбросу пароля отправлены на ваш email' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Ошибка запроса сброса пароля:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при запросе сброса пароля' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
