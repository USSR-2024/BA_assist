import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { authMiddleware } from '@/app/lib/auth'
import emailService from '@/app/services/email'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST /api/projects/:id/invite - Пригласить пользователя в проект
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const projectId = parseInt(params.id)
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { message: 'Email обязателен' },
        { status: 400 }
      )
    }
    
    // Получаем токен и данные пользователя (приглашающего)
    const token = request.cookies.get('token')?.value
    const { userId } = JSON.parse(
      Buffer.from(token!.split('.')[1], 'base64').toString()
    )
    
    // Проверяем, существует ли проект и доступ пользователя
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        users: { some: { id: userId } }
      }
    })
    
    if (!project) {
      return NextResponse.json(
        { message: 'Проект не найден или доступ запрещён' },
        { status: 403 }
      )
    }
    
    // Проверяем, существует ли пользователь с таким email
    const invitedUser = await prisma.user.findUnique({
      where: { email }
    })
    
    // Если пользователь существует, проверяем, не участвует ли он уже в проекте
    if (invitedUser) {
      const userInProject = await prisma.project.findFirst({
        where: {
          id: projectId,
          users: { some: { id: invitedUser.id } }
        }
      })
      
      if (userInProject) {
        return NextResponse.json(
          { message: 'Пользователь уже является участником проекта' },
          { status: 400 }
        )
      }
      
      // Добавляем пользователя в проект
      await prisma.project.update({
        where: { id: projectId },
        data: {
          users: {
            connect: { id: invitedUser.id }
          }
        }
      })
      
      // Получаем данные пригласившего
      const inviter = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      // Отправляем уведомление о добавлении в проект
      const appUrl = process.env.APP_URL || 'http://localhost:3000'
      const projectLink = `${appUrl}/dashboard/projects/${projectId}`
      
      await emailService.sendProjectInvitationEmail(
        email,
        project.title,
        inviter?.email || 'Участник проекта',
        projectLink
      )
      
      return NextResponse.json(
        { message: 'Пользователь успешно добавлен в проект' },
        { status: 200 }
      )
    } else {
      // Если пользователь не существует, создаем приглашение с временным токеном
      const invitationToken = jwt.sign(
        {
          projectId,
          email,
          inviterId: userId,
          type: 'project-invitation'
        },
        JWT_SECRET,
        { expiresIn: '7d' } // Срок действия - 7 дней
      )
      
      // Получаем данные пригласившего
      const inviter = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      // Отправляем письмо с приглашением
      const appUrl = process.env.APP_URL || 'http://localhost:3000'
      const invitationLink = `${appUrl}/auth/register?token=${invitationToken}`
      
      await emailService.sendProjectInvitationEmail(
        email,
        project.title,
        inviter?.email || 'Участник проекта',
        invitationLink
      )
      
      return NextResponse.json(
        { message: 'Приглашение отправлено на указанный email' },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Ошибка приглашения пользователя:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при приглашении пользователя' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
