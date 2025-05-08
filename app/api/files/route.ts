import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { Storage } from '@google-cloud/storage'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware } from '@/app/lib/auth'

const prisma = new PrismaClient()

// Инициализация Google Cloud Storage
// В реальном приложении, ключи должны быть в переменных окружения
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GCS_KEY_FILE,
})

const bucket = storage.bucket(process.env.GCS_BUCKET || 'baassist-files')

// GET /api/files/signed-url - Получить URL для загрузки
export async function GET(request: NextRequest) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  const url = new URL(request.url)
  const fileId = url.searchParams.get('id')

  if (!fileId) {
    return NextResponse.json(
      { message: 'ID файла обязателен' },
      { status: 400 }
    )
  }

  try {
    const file = await prisma.file.findUnique({
      where: { id: parseInt(fileId) },
      include: { project: true }
    })

    if (!file) {
      return NextResponse.json(
        { message: 'Файл не найден' },
        { status: 404 }
      )
    }

    // Проверить доступ пользователя к проекту, к которому принадлежит файл
    const token = request.cookies.get('token')?.value
    const { userId } = JSON.parse(
      Buffer.from(token!.split('.')[1], 'base64').toString()
    )

    const userHasAccess = await prisma.project.findFirst({
      where: {
        id: file.projectId,
        users: { some: { id: userId } }
      }
    })

    if (!userHasAccess) {
      return NextResponse.json(
        { message: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    // Создать временный URL для доступа к файлу
    const [signedUrl] = await bucket.file(file.gcsPath).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 минут
    })

    return NextResponse.json({ signedUrl }, { status: 200 })
  } catch (error) {
    console.error('Ошибка получения signed URL:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при получении URL' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}