import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '@/app/lib/auth'

const prisma = new PrismaClient()

// GET /api/glossary/:id - Получить конкретный термин
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const id = parseInt(params.id)
    
    const term = await prisma.glossaryTerm.findUnique({
      where: { id }
    })
    
    if (!term) {
      return NextResponse.json(
        { message: 'Термин не найден' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ term }, { status: 200 })
  } catch (error) {
    console.error('Ошибка получения термина:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при получении термина' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT /api/glossary/:id - Обновить термин
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const id = parseInt(params.id)
    const { term, definition } = await request.json()

    if (!term || !definition) {
      return NextResponse.json(
        { message: 'Термин и определение обязательны' },
        { status: 400 }
      )
    }

    // Проверка на существование термина
    const existingTerm = await prisma.glossaryTerm.findUnique({
      where: { id }
    })

    if (!existingTerm) {
      return NextResponse.json(
        { message: 'Термин не найден' },
        { status: 404 }
      )
    }

    // Обновление термина
    const updatedTerm = await prisma.glossaryTerm.update({
      where: { id },
      data: { term, definition }
    })

    return NextResponse.json({ term: updatedTerm }, { status: 200 })
  } catch (error) {
    console.error('Ошибка обновления термина:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при обновлении термина' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/glossary/:id - Удалить термин
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const id = parseInt(params.id)

    // Проверка на существование термина
    const existingTerm = await prisma.glossaryTerm.findUnique({
      where: { id }
    })

    if (!existingTerm) {
      return NextResponse.json(
        { message: 'Термин не найден' },
        { status: 404 }
      )
    }

    // Удаление термина
    await prisma.glossaryTerm.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Термин успешно удален' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Ошибка удаления термина:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при удалении термина' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
