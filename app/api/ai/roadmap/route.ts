// app/api/ai/roadmap/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { AIService } from '@/lib/ai-service';
import { createLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

const logger = createLogger('API:AI:Roadmap');

/**
 * Генерирует дорожную карту и рекомендации по фреймворку для проекта
 * POST /api/ai/roadmap
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
    const data = await request.json();
    
    // Анализируем данные интервью и генерируем рекомендации
    const analysisResults = await AIService.analyzeInterviewWithAI(data);
    
    logger.info(`Сгенерирована дорожная карта для фреймворка ${analysisResults.framework}`);
    
    // Возвращаем результаты анализа
    return NextResponse.json({
      success: true,
      data: analysisResults
    }, { status: 200 });
  } catch (error) {
    logger.error('Ошибка при генерации дорожной карты:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при генерации дорожной карты' },
      { status: 500 }
    );
  }
}

/**
 * Генерирует задачи на основе дорожной карты проекта
 * POST /api/ai/roadmap/tasks
 */
export async function generateTasksFromRoadmap(request: NextRequest) {
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
    const { projectId, roadmap } = await request.json();
    
    if (!projectId || !roadmap) {
      return NextResponse.json(
        { success: false, error: 'Не указан ID проекта или дорожная карта' },
        { status: 400 }
      );
    }
    
    // Проверяем существование проекта и права доступа
    const userId = authResult.userId;
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(projectId),
        users: { some: { id: userId } }
      }
    });
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Проект не найден или доступ запрещён' },
        { status: 403 }
      );
    }
    
    // Генерируем задачи на основе дорожной карты
    const tasks = [];
    
    for (const phase of roadmap) {
      // Создаем задачу для фазы
      const phaseTask = await prisma.task.create({
        data: {
          projectId: parseInt(projectId),
          title: `Фаза: ${phase.phase}`,
          status: 'TODO',
          priority: 3, // Высокий приоритет для фаз
        }
      });
      
      tasks.push(phaseTask);
      
      // Создаем задачи для артефактов
      for (const artifact of phase.artifacts) {
        const artifactTask = await prisma.task.create({
          data: {
            projectId: parseInt(projectId),
            title: `Создать: ${artifact}`,
            status: 'TODO',
            priority: 2, // Средний приоритет для артефактов
          }
        });
        
        tasks.push(artifactTask);
      }
    }
    
    logger.info(`Создано ${tasks.length} задач на основе дорожной карты для проекта ${projectId}`);
    
    return NextResponse.json({
      success: true,
      data: tasks
    }, { status: 200 });
  } catch (error) {
    logger.error('Ошибка при генерации задач из дорожной карты:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при генерации задач' },
      { status: 500 }
    );
  }
}