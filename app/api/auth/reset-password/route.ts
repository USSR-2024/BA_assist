import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import emailService from '@/app/services/email'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST /api/auth/reset-password - Сброс пароля
export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { message: 'Токен и новый пароль обязательны' },
        { status: 400 }
      )
    }

    // Проверяем токен
    let payload: any
    try {
      payload = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { message: 'Недействительный или истекший токен сброса пароля' },
        { status: 400 }
      )
    }

    // Проверяем, что это токен для сброса пароля
    if (!payload.userId || !payload.email || payload.type !== 'password-reset') {
      return NextResponse.json(
        { message: 'Недействительный токен сброса пароля' },
        { status: 400 }
      )
    }

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Проверяем, совпадает ли email
    if (user.email !== payload.email) {
      return NextResponse.json(
        { message: 'Email не совпадает с данными в токене' },
        { status: 400 }
      )
    }

    // Хэшируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Обновляем пароль пользователя
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    // Отправляем уведомление об изменении пароля
    await emailService.sendEmail({
      to: user.email,
      subject: 'Ваш пароль был изменен',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Изменение пароля в BA Assist</h2>
          <p>Здравствуйте!</p>
          <p>Ваш пароль в системе BA Assist был успешно изменен.</p>
          <p>Если вы не запрашивали изменение пароля, пожалуйста, немедленно свяжитесь с администратором или восстановите доступ к аккаунту.</p>
          <p>С уважением,<br>Команда BA Assist</p>
        </div>
      `
    })

    return NextResponse.json(
      { message: 'Пароль успешно изменен' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Ошибка сброса пароля:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при сбросе пароля' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
