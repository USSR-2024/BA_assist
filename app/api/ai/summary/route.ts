// app/api/ai/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { AIService } from '@/lib/ai-service';
import { createLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

const logger = createLogger('API:AI:Summary');

/**
 * Генерирует саммари проекта на основе данных проекта и файлов
 * POST /api/ai/summary
 */
export async function POST(request: NextRequest) {
  const authResult = await authMiddleware(request);
  
  if ('success' in authResult === false) {
    return authResult;
  }
  
  if (!authResult.success) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: 401 }
    );
  }

  try {
    // Получаем данные из запроса
    const { projectId } = await request.json();
    
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Не указан ID проекта' },
        { status: 400 }
      );
    }
    
    // Проверяем существование проекта и права доступа
    const userId = authResult.userId;
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(projectId),
        users: { some: { id: userId } }
      },
      include: {
        files: {
          where: { status: 'PARSED' },
          select: { id: true, name: true, text: true }
        }
      }
    });
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Проект не найден или доступ запрещён' },
        { status: 403 }
      );
    }
    
    // Генерируем саммари проекта с использованием системных настроек OpenAI
    const summary = await AIService.generateProjectSummary(project);
    
    // Обновляем проект с новым саммари
    await prisma.project.update({
      where: { id: parseInt(projectId) },
      data: { summary }
    });
    
    logger.info(`Обновлено саммари для проекта ${projectId}`);
    
    return NextResponse.json({
      success: true,
      data: { summary }
    }, { status: 200 });
  } catch (error) {
    logger.error('Ошибка при генерации саммари проекта:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при генерации саммари' },
      { status: 500 }
    );
  }
}