import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:BusinessProcesses');

/**
 * GET /api/business-processes - Получить список бизнес-процессов
 */
export async function GET(request: NextRequest) {
  const authResult = await authMiddleware(request);
  
  if ('success' in authResult === false) {
    return authResult;
  }
  
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const parentId = url.searchParams.get('parentId');

    // Если указан parentId, возвращаем только дочерние процессы
    // Если parentId = null, возвращаем процессы верхнего уровня
    const whereClause = parentId 
      ? { parentId } 
      : { parentId: null };

    const processes = await prisma.businessProcess.findMany({
      where: whereClause,
      orderBy: { title: 'asc' },
      include: {
        children: {
          select: {
            id: true,
            title: true,
            _count: {
              select: { children: true }
            }
          }
        },
        _count: {
          select: { children: true }
        }
      }
    });

    logger.info(`Получено ${processes.length} бизнес-процессов`);
    return NextResponse.json({ success: true, data: processes }, { status: 200 });
  } catch (error) {
    logger.error('Ошибка получения бизнес-процессов:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при получении бизнес-процессов' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/business-processes - Создать новый бизнес-процесс
 */
export async function POST(request: NextRequest) {
  const authResult = await authMiddleware(request);
  
  if ('success' in authResult === false) {
    return authResult;
  }
  
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
  }

  try {
    const { title, description, parentId } = await request.json();

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Название бизнес-процесса обязательно' },
        { status: 400 }
      );
    }

    // Если указан parentId, проверяем его существование
    if (parentId) {
      const parentExists = await prisma.businessProcess.findUnique({
        where: { id: parentId }
      });

      if (!parentExists) {
        return NextResponse.json(
          { success: false, error: 'Родительский бизнес-процесс не найден' },
          { status: 404 }
        );
      }
    }

    // Создаем новый бизнес-процесс
    const process = await prisma.businessProcess.create({
      data: {
        title,
        description,
        parentId: parentId || null
      }
    });

    logger.info(`Создан новый бизнес-процесс: ${title} (ID: ${process.id})`);
    return NextResponse.json({ success: true, data: process }, { status: 201 });
  } catch (error) {
    logger.error('Ошибка создания бизнес-процесса:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при создании бизнес-процесса' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}