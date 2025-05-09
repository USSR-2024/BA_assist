// API-эндпоинт для работы с фреймворками
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:Frameworks');

/**
 * Получение списка фреймворков
 * 
 * GET /api/frameworks
 */
export async function GET(request: NextRequest) {
  // Проверяем аутентификацию пользователя
  const authResult = await authMiddleware(request);
  if (!authResult.success) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: 401 }
    );
  }

  try {
    // Определяем параметры запроса
    const url = new URL(request.url);
    const includePhases = url.searchParams.get('includePhases') === 'true';
    const includeTasks = url.searchParams.get('includeTasks') === 'true';
    
    // Получаем все фреймворки из базы данных
    const frameworks = await prisma.framework.findMany({
      include: {
        phases: includePhases ? {
          orderBy: {
            order: 'asc'
          },
          include: includeTasks ? {
            tasks: true
          } : undefined
        } : undefined
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // Возвращаем результаты
    return NextResponse.json({
      success: true,
      data: frameworks
    });
    
  } catch (error) {
    logger.error('Ошибка при получении фреймворков:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при получении фреймворков' },
      { status: 500 }
    );
  }
}

/**
 * Создание нового пользовательского фреймворка
 * 
 * POST /api/frameworks
 */
export async function POST(request: NextRequest) {
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
      { success: false, error: 'Только пользователи с ролью OWNER могут создавать фреймворки' },
      { status: 403 }
    );
  }

  try {
    // Получаем данные из запроса
    const data = await request.json();
    
    // Валидируем данные
    if (!data.name || !data.ruName || !data.description || !data.ruDescription) {
      return NextResponse.json(
        { success: false, error: 'Не указаны обязательные поля' },
        { status: 400 }
      );
    }
    
    // Генерируем уникальный ID для фреймворка
    const id = `FR-CUSTOM-${Date.now()}`;
    
    // Создаем новый фреймворк
    const framework = await prisma.framework.create({
      data: {
        id,
        name: data.name,
        ruName: data.ruName,
        description: data.description,
        ruDescription: data.ruDescription,
        methodologyTag: data.methodologyTag || [],
        isDefault: false,
        isSystem: false,
        isCustom: true,
        suitabilityCriteria: data.suitabilityCriteria || {}
      }
    });
    
    // Если переданы фазы, создаем их
    if (data.phases && Array.isArray(data.phases)) {
      for (let i = 0; i < data.phases.length; i++) {
        const phase = data.phases[i];
        const phaseId = `${id}-P${i+1}`;
        
        await prisma.phase.create({
          data: {
            id: phaseId,
            frameworkId: id,
            name: phase.name,
            ruName: phase.ruName,
            order: i + 1,
            description: phase.description || null,
            ruDescription: phase.ruDescription || null,
            durationWeeks: phase.durationWeeks || 1
          }
        });
      }
    }
    
    logger.info(`Создан новый пользовательский фреймворк: ${data.name} (${id})`);
    
    // Возвращаем созданный фреймворк
    return NextResponse.json({
      success: true,
      data: framework
    }, { status: 201 });
    
  } catch (error) {
    logger.error('Ошибка при создании фреймворка:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при создании фреймворка' },
      { status: 500 }
    );
  }
}