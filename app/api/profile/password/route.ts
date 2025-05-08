import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { authMiddleware } from '@/app/lib/auth'

const prisma = new PrismaClient()

// POST /api/profile/password - Изменить пароль пользователя
export async function POST(request: NextRequest) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const { currentPassword, newPassword } = await request.json()
    
    // Проверка наличия необходимых данных
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Необходимо указать текущий и новый пароль' },
        { status: 400 }
      )
    }
    
    // Получаем ID пользователя из токена
    const token = request.cookies.get('token')?.value
    const { userId } = JSON.parse(
      Buffer.from(token!.split('.')[1], 'base64').toString()
    )
    
    // Получаем данные пользователя из базы данных
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return NextResponse.json(
        { message: 'Пользователь не найден' },
        { status: 404 }
      )
    }
    
    // Проверка текущего пароля
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Неверный текущий пароль' },
        { status: 401 }
      )
    }
    
    // Хэширование нового пароля
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // Обновление пароля в базе данных
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })
    
    return NextResponse.json(
      { message: 'Пароль успешно изменен' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Ошибка смены пароля:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при смене пароля' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
