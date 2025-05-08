import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, checkRole } from '@/app/lib/auth'

const prisma = new PrismaClient()

// GET /api/projects/:id - Получить детали проекта
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Некорректный ID проекта' },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        files: true,
        tasks: {
          orderBy: { priority: 'asc' }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { message: 'Проект не найден' },
        { status: 404 }
      )
    }

    // Проверка, есть ли доступ у пользователя к проекту
    const token = request.cookies.get('token')?.value
    const { userId } = JSON.parse(
      Buffer.from(token!.split('.')[1], 'base64').toString()
    )

    const userHasAccess = project.users.some(user => user.id === userId)
    if (!userHasAccess) {
      return NextResponse.json(
        { message: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    return NextResponse.json(project, { status: 200 })
  } catch (error) {
    console.error('Ошибка получения проекта:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при получении проекта' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT /api/projects/:id - Обновить проект
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Некорректный ID проекта' },
        { status: 400 }
      )
    }

    const { title, description, status } = await request.json()
    
    // Проверка наличия обязательных полей
    if (!title) {
      return NextResponse.json(
        { message: 'Название проекта обязательно' },
        { status: 400 }
      )
    }

    // Проверка, существует ли проект
    const project = await prisma.project.findUnique({
      where: { id },
      include: { users: { select: { id: true, role: true } } }
    })

    if (!project) {
      return NextResponse.json(
        { message: 'Проект не найден' },
        { status: 404 }
      )
    }

    // Проверка прав пользователя
    const token = request.cookies.get('token')?.value
    const { userId, role } = JSON.parse(
      Buffer.from(token!.split('.')[1], 'base64').toString()
    )

    // Проверка, что пользователь имеет доступ к проекту
    const userInProject = project.users.find(user => user.id === userId)
    if (!userInProject) {
      return NextResponse.json(
        { message: 'Доступ запрещён' },
        { status: 403 }
      )
    }

    // Если меняется статус, проверяем что пользователь Owner
    if (status && status !== project.status && role !== 'OWNER') {
      return NextResponse.json(
        { message: 'Только Owner может изменить статус проекта' },
        { status: 403 }
      )
    }

    // Обновление проекта
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        title,
        description,
        ...(status && { status })
      }
    })

    return NextResponse.json(updatedProject, { status: 200 })
  } catch (error) {
    console.error('Ошибка обновления проекта:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при обновлении проекта' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/projects/:id - Удалить (или архивировать) проект
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { message: 'Некорректный ID проекта' },
        { status: 400 }
      )
    }

    // Проверка, существует ли проект
    const project = await prisma.project.findUnique({
      where: { id }
    })

    if (!project) {
      return NextResponse.json(
        { message: 'Проект не найден' },
        { status: 404 }
      )
    }

    // Проверка, что пользователь является Owner
    const roleError = await checkRole(request, ['OWNER'])
    if (roleError) return roleError

    // По требованиям, мы архивируем проект, а не удаляем физически
    const archivedProject = await prisma.project.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    })

    return NextResponse.json(
      { message: 'Проект успешно архивирован' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Ошибка архивации проекта:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при архивации проекта' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}