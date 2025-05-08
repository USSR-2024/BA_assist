import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET /api/auth/reset-password/validate?token=... - Проверка валидности токена сброса пароля
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { message: 'Токен сброса пароля отсутствует' },
        { status: 400 }
      )
    }

    // Проверяем токен
    try {
      const payload: any = jwt.verify(token, JWT_SECRET)
      
      // Проверяем, что это токен для сброса пароля
      if (!payload.userId || !payload.email || payload.type !== 'password-reset') {
        return NextResponse.json(
          { message: 'Недействительный токен сброса пароля' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { message: 'Токен действителен' },
        { status: 200 }
      )
    } catch (error) {
      // Ошибка проверки токена (истек или недействителен)
      return NextResponse.json(
        { message: 'Недействительный или истекший токен сброса пароля' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Ошибка проверки токена:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при проверке токена' },
      { status: 500 }
    )
  }
}
