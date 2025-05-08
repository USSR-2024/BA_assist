import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key' // В продакшене использовать переменную окружения

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Проверка, что email и пароль предоставлены
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    // Поиск пользователя по email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Проверка верификации аккаунта
    if (!user.isVerified) {
      return NextResponse.json(
        { message: 'Аккаунт не подтвержден. Проверьте вашу почту.' },
        { status: 401 }
      )
    }

    // Создание JWT токена
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    )

    // Установка куки
    cookies().set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 12 * 60 * 60, // 12 часов
      path: '/',
      sameSite: 'strict',
    })

    return NextResponse.json(
      { message: 'Вход выполнен успешно' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Ошибка входа:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при входе' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
