import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

/**
 * API-endpoint для верификации email пользователя по токену
 * GET /api/auth/verify?token=...
 */
export async function GET(req: NextRequest) {
  try {
    // Получение токена из строки запроса
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    // Проверка наличия токена
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Отсутствует токен верификации' },
        { status: 400 }
      )
    }

    try {
      // Верификация токена
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string
        email: string
        type: string
      }

      // Проверка типа токена
      if (decoded.type !== 'verification') {
        return NextResponse.json(
          { success: false, message: 'Неверный тип токена' },
          { status: 400 }
        )
      }

      // Поиск пользователя
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      })

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Пользователь не найден' },
          { status: 404 }
        )
      }

      // Если пользователь уже верифицирован
      if (user.isVerified) {
        return NextResponse.json(
          { success: true, message: 'Аккаунт уже подтвержден' }
        )
      }

      // Обновление статуса верификации пользователя
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { isVerified: true }
      })

      // Редирект на страницу успешной верификации
      return NextResponse.redirect(new URL('/auth/verification-success', req.url))
      
    } catch (jwtError) {
      console.error('Ошибка верификации токена:', jwtError)
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Недействительный или просроченный токен верификации',
          error: jwtError instanceof Error ? jwtError.message : 'Ошибка верификации'
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Ошибка при верификации пользователя:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Ошибка сервера при верификации пользователя',
        error: error instanceof Error ? error.message : 'Внутренняя ошибка сервера'
      },
      { status: 500 }
    )
  }
}