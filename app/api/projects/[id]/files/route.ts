import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '@/app/lib/auth'

const prisma = new PrismaClient()

// GET /api/projects/:id/files - Получить файлы проекта
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const projectId = parseInt(params.id)
    
    // Проверяем права доступа к проекту
    const token = request.cookies.get('token')?.value
    const { userId } = JSON.parse(
      Buffer.from(token!.split('.')[1], 'base64').toString()
    )
    
    const userHasAccess = await prisma.project.findFirst({
      where: {
        id: projectId,
        users: { some: { id: userId } }
      }
    })
    
    if (!userHasAccess) {
      return NextResponse.json(
        { message: 'Проект не найден или доступ запрещён' },
        { status: 403 }
      )
    }
    
    // Получаем файлы проекта
    const files = await prisma.file.findMany({
      where: { projectId },
      orderBy: { uploadedAt: 'desc' }
    })
    
    return NextResponse.json({ files }, { status: 200 })
  } catch (error) {
    console.error('Ошибка получения файлов:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при получении файлов' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
