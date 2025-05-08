import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '@/app/lib/auth'

const prisma = new PrismaClient()

// GET /api/search?q=query - Поиск по файлам проектов
export async function GET(request: NextRequest) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')

    if (!query || query.trim().length < 3) {
      return NextResponse.json(
        { message: 'Поисковый запрос должен содержать не менее 3 символов' },
        { status: 400 }
      )
    }

    // Получаем токен и данные пользователя
    const token = request.cookies.get('token')?.value
    const { userId } = JSON.parse(
      Buffer.from(token!.split('.')[1], 'base64').toString()
    )

    // Ищем файлы, содержащие текст запроса
    // и к которым у пользователя есть доступ
    const files = await prisma.file.findMany({
      where: {
        status: 'PARSED',
        text: {
          contains: query,
          mode: 'insensitive'
        },
        project: {
          users: {
            some: { id: userId }
          }
        }
      },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Формируем результаты поиска
    const results = files.map(file => {
      // Находим подстроку вокруг найденного текста
      let excerpt = ''
      if (file.text) {
        const text = file.text.toLowerCase()
        const queryPos = text.indexOf(query.toLowerCase())
        
        if (queryPos !== -1) {
          // Берем текст до 100 символов до и после найденного запроса
          const start = Math.max(0, queryPos - 100)
          const end = Math.min(file.text.length, queryPos + query.length + 100)
          excerpt = file.text.substring(start, end)
          
          // Добавляем троеточия, если текст был обрезан
          if (start > 0) excerpt = '...' + excerpt
          if (end < file.text.length) excerpt = excerpt + '...'
        } else {
          // На случай, если поиск был по множественному совпадению или другим причинам
          excerpt = file.text.substring(0, 200) + '...'
        }
      }

      return {
        id: file.id,
        fileId: file.id,
        fileName: file.name,
        excerpt,
        projectId: file.project.id,
        projectTitle: file.project.title
      }
    })

    return NextResponse.json({ results }, { status: 200 })
  } catch (error) {
    console.error('Ошибка поиска:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при выполнении поиска' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
