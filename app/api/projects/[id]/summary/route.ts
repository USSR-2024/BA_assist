import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '@/app/lib/auth'

const prisma = new PrismaClient()

// POST /api/projects/:id/summary - Обновить саммари проекта
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request)
  if (authError) return authError

  try {
    const projectId = parseInt(params.id)

    // Получение данных о проекте
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        files: {
          where: { status: 'PARSED' },
          select: { name: true, text: true }
        },
        tasks: true,
      }
    })

    if (!project) {
      return NextResponse.json(
        { message: 'Проект не найден' },
        { status: 404 }
      )
    }

    // Генерация саммари на основе данных проекта
    // В MVP-Lite используем простой шаблонный подход
    let summary = `Проект "${project.title}".\n\n`

    if (project.files.length > 0) {
      summary += `Содержит ${project.files.length} обработанных файлов.\n`
    } else {
      summary += 'Пока не содержит обработанных файлов.\n'
    }

    const taskStats = {
      total: project.tasks.length,
      todo: project.tasks.filter(t => t.status === 'TODO').length,
      inProgress: project.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      done: project.tasks.filter(t => t.status === 'DONE').length
    }

    if (taskStats.total > 0) {
      summary += `\nЗадачи: ${taskStats.total} всего, ${taskStats.todo} к выполнению, ${taskStats.inProgress} в работе, ${taskStats.done} завершены.\n`
      
      // Добавляем информацию о приоритетах
      const highPriority = project.tasks.filter(t => t.priority === 3 && t.status !== 'DONE').length
      
      if (highPriority > 0) {
        summary += `\nВнимание: ${highPriority} задач с высоким приоритетом требуют выполнения.`
      }
    } else {
      summary += '\nПока нет созданных задач.'
    }

    // Обновление саммари в БД
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { summary }
    })

    return NextResponse.json({ summary }, { status: 200 })
  } catch (error) {
    console.error('Ошибка обновления саммари:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера при обновлении саммари' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
