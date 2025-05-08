import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '@/app/lib/auth'

const prisma = new PrismaClient()

// GET /api/glossary - Получить список терминов глоссария
export async function GET(request: NextRequest) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const terms = await prisma.glossaryTerm.findMany({
      orderBy: { term: 'asc' }
    })

    return NextResponse.json({ terms }, { status: 200 })
  } catch (error) {
    console.error('Ошибка получения глоссария:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при получении глоссария' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST /api/glossary - Создать новый термин в глоссарии
export async function POST(request: NextRequest) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const { term, definition } = await request.json()

    if (!term || !definition) {
      return NextResponse.json(
        { message: 'Термин и определение обязательны' },
        { status: 400 }
      )
    }

    // Проверка на существование термина
    const existingTerm = await prisma.glossaryTerm.findFirst({
      where: {
        term: { equals: term, mode: 'insensitive' }
      }
    })

    if (existingTerm) {
      return NextResponse.json(
        { message: 'Термин уже существует в глоссарии' },
        { status: 400 }
      )
    }

    // Создание нового термина
    const newTerm = await prisma.glossaryTerm.create({
      data: { term, definition }
    })

    return NextResponse.json({ term: newTerm }, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания термина:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при создании термина' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
