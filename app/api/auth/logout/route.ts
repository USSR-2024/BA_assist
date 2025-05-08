import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// POST /api/auth/logout - Выход из системы
export async function POST() {
  try {
    // Удаляем куки с токеном
    cookies().delete('token')
    
    return NextResponse.json(
      { message: 'Выход выполнен успешно' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Ошибка выхода:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при выходе' },
      { status: 500 }
    )
  }
}
