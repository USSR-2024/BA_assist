import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:BusinessProcess');

/**
 * GET /api/business-processes/:id - Получить бизнес-процесс по ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authMiddleware(request);
  
  if ('success' in authResult === false) {
    return authResult;
  }
  
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
  }

  try {
    const id = params.id;

    const process = await prisma.businessProcess.findUnique({
      where: { id },
      include: {
        children: {
          orderBy: { title: 'asc' }
        },
        parent: true
      }
    });

    if (!process) {
      return NextResponse.json(
        { success: false, error: 'Бизнес-процесс не найден' },
        { status: 404 }
      );
    }

    logger.info(`Получен бизнес-процесс: ${process.title} (ID: ${process.id})`);
    return NextResponse.json({ success: true, data: process }, { status: 200 });
  } catch (error) {
    logger.error('Ошибка получения бизнес-процесса:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при получении бизнес-процесса' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/business-processes/:id - Обновить бизнес-процесс
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authMiddleware(request);
  
  if ('success' in authResult === false) {
    return authResult;
  }
  
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
  }

  try {
    const id = params.id;
    const { title, description, parentId } = await request.json();

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Название бизнес-процесса обязательно' },
        { status: 400 }
      );
    }

    // Проверяем существование процесса
    const existingProcess = await prisma.businessProcess.findUnique({
      where: { id }
    });

    if (!existingProcess) {
      return NextResponse.json(
        { success: false, error: 'Бизнес-процесс не найден' },
        { status: 404 }
      );
    }

    // Проверка на циклическую зависимость
    if (parentId && parentId !== existingProcess.parentId) {
      // Если новый родитель указан и он отличается от текущего,
      // проверяем, не является ли он потомком текущего процесса
      const isDescendant = await checkIsDescendant(id, parentId);
      if (isDescendant) {
        return NextResponse.json(
          { success: false, error: 'Невозможно установить данный родительский процесс (циклическая зависимость)' },
          { status: 400 }
        );
      }
    }

    // Обновляем процесс
    const process = await prisma.businessProcess.update({
      where: { id },
      data: {
        title,
        description,
        parentId: parentId || null
      }
    });

    logger.info(`Обновлен бизнес-процесс: ${process.title} (ID: ${process.id})`);
    return NextResponse.json({ success: true, data: process }, { status: 200 });
  } catch (error) {
    logger.error('Ошибка обновления бизнес-процесса:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при обновлении бизнес-процесса' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * DELETE /api/business-processes/:id - Удалить бизнес-процесс
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authMiddleware(request);
  
  if ('success' in authResult === false) {
    return authResult;
  }
  
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
  }

  try {
    const id = params.id;

    // Проверяем существование процесса
    const existingProcess = await prisma.businessProcess.findUnique({
      where: { id },
      include: {
        children: {
          select: { id: true }
        }
      }
    });

    if (!existingProcess) {
      return NextResponse.json(
        { success: false, error: 'Бизнес-процесс не найден' },
        { status: 404 }
      );
    }

    // Проверяем, нет ли дочерних процессов
    if (existingProcess.children.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Нельзя удалить бизнес-процесс, имеющий дочерние процессы. Сначала удалите или переместите дочерние процессы.' 
        },
        { status: 400 }
      );
    }

    // Удаляем процесс
    await prisma.businessProcess.delete({
      where: { id }
    });

    logger.info(`Удален бизнес-процесс: ${existingProcess.title} (ID: ${existingProcess.id})`);
    return NextResponse.json({ success: true, message: 'Бизнес-процесс успешно удален' }, { status: 200 });
  } catch (error) {
    logger.error('Ошибка удаления бизнес-процесса:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при удалении бизнес-процесса' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Проверяет, является ли один процесс потомком другого (для предотвращения циклических зависимостей)
 * @param processId ID процесса
 * @param potentialAncestorId ID потенциального предка
 * @returns true, если potentialAncestorId является потомком processId (циклическая зависимость)
 */
async function checkIsDescendant(processId: string, potentialAncestorId: string): Promise<boolean> {
  // Если ID совпадают, это циклическая зависимость
  if (processId === potentialAncestorId) {
    return true;
  }

  const potentialAncestor = await prisma.businessProcess.findUnique({
    where: { id: potentialAncestorId },
    select: { parentId: true }
  });

  // Если у потенциального предка нет родителя, значит он не потомок
  if (!potentialAncestor || !potentialAncestor.parentId) {
    return false;
  }

  // Рекурсивно проверяем, является ли родитель потенциального предка потомком процесса
  return checkIsDescendant(processId, potentialAncestor.parentId);
}