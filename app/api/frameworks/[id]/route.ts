// API-эндпоинт для работы с конкретным фреймворком
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:Frameworks:ID');

interface Params {
  params: {
    id: string;
  };
}

/**
 * Получение информации о конкретном фреймворке
 * 
 * GET /api/frameworks/:id
 */
export async function GET(request: NextRequest, { params }: Params) {
  // Проверяем аутентификацию пользователя
  const authResult = await authMiddleware(request);
  if (!authResult.success) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: 401 }
    );
  }

  try {
    const { id } = params;
    
    // Определяем параметры запроса
    const url = new URL(request.url);
    const includeTasks = url.searchParams.get('includeTasks') === 'true';
    
    // Получаем фреймворк из базы данных
    const framework = await prisma.framework.findUnique({
      where: { id },
      include: {
        phases: {
          orderBy: {
            order: 'asc'
          },
          include: includeTasks ? {
            tasks: true
          } : undefined
        }
      }
    });
    
    if (!framework) {
      return NextResponse.json(
        { success: false, error: 'Фреймворк не найден' },
        { status: 404 }
      );
    }
    
    // Возвращаем результаты
    return NextResponse.json({
      success: true,
      data: framework
    });
    
  } catch (error) {
    logger.error('Ошибка при получении фреймворка:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при получении фреймворка' },
      { status: 500 }
    );
  }
}

/**
 * Обновление пользовательского фреймворка
 * 
 * PUT /api/frameworks/:id
 */
export async function PUT(request: NextRequest, { params }: Params) {
  // Проверяем аутентификацию пользователя
  const authResult = await authMiddleware(request);
  if (!authResult.success) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: 401 }
    );
  }
  
  // Проверяем, что пользователь имеет роль OWNER
  if (authResult.role !== 'OWNER') {
    return NextResponse.json(
      { success: false, error: 'Только пользователи с ролью OWNER могут обновлять фреймворки' },
      { status: 403 }
    );
  }

  try {
    const { id } = params;
    
    // Проверяем, существует ли фреймворк
    const existingFramework = await prisma.framework.findUnique({
      where: { id }
    });
    
    if (!existingFramework) {
      return NextResponse.json(
        { success: false, error: 'Фреймворк не найден' },
        { status: 404 }
      );
    }
    
    // Проверяем, что это пользовательский фреймворк
    if (!existingFramework.isCustom) {
      return NextResponse.json(
        { success: false, error: 'Можно редактировать только пользовательские фреймворки' },
        { status: 403 }
      );
    }
    
    // Получаем данные из запроса
    const data = await request.json();
    
    // Обновляем фреймворк
    const updatedFramework = await prisma.framework.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : existingFramework.name,
        ruName: data.ruName !== undefined ? data.ruName : existingFramework.ruName,
        description: data.description !== undefined ? data.description : existingFramework.description,
        ruDescription: data.ruDescription !== undefined ? data.ruDescription : existingFramework.ruDescription,
        methodologyTag: data.methodologyTag !== undefined ? data.methodologyTag : existingFramework.methodologyTag,
        suitabilityCriteria: data.suitabilityCriteria !== undefined ? data.suitabilityCriteria : existingFramework.suitabilityCriteria
      }
    });
    
    logger.info(`Обновлен пользовательский фреймворк: ${updatedFramework.name} (${id})`);
    
    // Возвращаем обновленный фреймворк
    return NextResponse.json({
      success: true,
      data: updatedFramework
    });
    
  } catch (error) {
    logger.error('Ошибка при обновлении фреймворка:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при обновлении фреймворка' },
      { status: 500 }
    );
  }
}

/**
 * Удаление пользовательского фреймворка
 * 
 * DELETE /api/frameworks/:id
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  // Проверяем аутентификацию пользователя
  const authResult = await authMiddleware(request);
  if (!authResult.success) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: 401 }
    );
  }
  
  // Проверяем, что пользователь имеет роль OWNER
  if (authResult.role !== 'OWNER') {
    return NextResponse.json(
      { success: false, error: 'Только пользователи с ролью OWNER могут удалять фреймворки' },
      { status: 403 }
    );
  }

  try {
    const { id } = params;
    
    // Проверяем, существует ли фреймворк
    const existingFramework = await prisma.framework.findUnique({
      where: { id }
    });
    
    if (!existingFramework) {
      return NextResponse.json(
        { success: false, error: 'Фреймворк не найден' },
        { status: 404 }
      );
    }
    
    // Проверяем, что это пользовательский фреймворк
    if (!existingFramework.isCustom) {
      return NextResponse.json(
        { success: false, error: 'Можно удалять только пользовательские фреймворки' },
        { status: 403 }
      );
    }
    
    // Удаляем связанные фазы и задачи
    // Благодаря каскадному удалению в Prisma, удаление фреймворка автоматически 
    // удалит связанные фазы, а удаление фаз удалит связанные задачи
    
    // Удаляем фреймворк
    await prisma.framework.delete({
      where: { id }
    });
    
    logger.info(`Удален пользовательский фреймворк: ${existingFramework.name} (${id})`);
    
    // Возвращаем успешный ответ
    return NextResponse.json({
      success: true,
      message: 'Фреймворк успешно удален'
    });
    
  } catch (error) {
    logger.error('Ошибка при удалении фреймворка:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при удалении фреймворка' },
      { status: 500 }
    );
  }
}