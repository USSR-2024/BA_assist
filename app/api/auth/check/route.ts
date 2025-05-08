import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET() {
  try {
    // Получение токена из куки
    const token = cookies().get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { authenticated: false, message: 'Требуется авторизация' },
        { status: 401 }
      )
    }

    // Верификация токена
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string
        email: string
        role: string
      }

      return NextResponse.json(
        {
          authenticated: true,
          user: {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role
          }
        },
        { status: 200 }
      )
    } catch (error) {
      // Токен не валидный или истек
      cookies().delete('token')
      return NextResponse.json(
        { authenticated: false, message: 'Сессия истекла' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Ошибка проверки авторизации:', error)
    return NextResponse.json(
      { authenticated: false, message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
