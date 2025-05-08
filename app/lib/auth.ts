import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key' // В продакшене использовать переменную окружения

// Промежуточное ПО для проверки аутентификации
export async function authMiddleware(request: NextRequest) {
  try {
    // Получение токена из куки
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { message: 'Требуется аутентификация' },
        { status: 401 }
      )
    }
    
    // Проверка токена
    try {
      jwt.verify(token, JWT_SECRET)
      // Токен валиден - продолжаем выполнение
      return null
    } catch (error) {
      // Токен недействителен
      return NextResponse.json(
        { message: 'Недействительный токен. Пожалуйста, войдите снова.' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Ошибка аутентификации:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при аутентификации' },
      { status: 500 }
    )
  }
}

// Проверка роли пользователя
export function checkRole(token: string, allowedRoles: string[]) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string }
    return allowedRoles.includes(decoded.role)
  } catch {
    return false
  }
}
