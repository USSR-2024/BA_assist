// API-эндпоинт для рекомендации фреймворков на основе данных интервью с ИИ
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';
import { InterviewData } from '@/app/contexts/InterviewContext';
import { AIService } from '@/lib/ai-service';

const logger = createLogger('API:Frameworks:Recommend');

/**
 * Получение списка фреймворков и рекомендаций для проекта
 *
 * GET /api/frameworks/recommend?projectId=123
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
    // Получаем ID проекта из параметров запроса
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'ID проекта не указан' },
        { status: 400 }
      );
    }

    // Получаем данные проекта
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
      select: {
        id: true,
        title: true,
        businessNeed: true,
        deliverables: true,
        durationBucket: true,
        coreTeamSize: true,
        processMaturity: true,
        preferredStyle: true,
        riskTolerance: true
      }
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Проект не найден' },
        { status: 404 }
      );
    }

    // Получаем все фреймворки из базы данных
    const frameworks = await prisma.framework.findMany({
      include: {
        phases: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    // Возвращаем список фреймворков
    return NextResponse.json({
      frameworks: frameworks.map(f => ({
        id: f.id,
        name: f.name,
        ruName: f.ruName,
        description: f.description,
        ruDescription: f.ruDescription,
        methodologyTag: f.methodologyTag,
        isDefault: f.isDefault,
        isSystem: f.isSystem
      }))
    });

  } catch (error) {
    logger.error('Ошибка при получении списка фреймворков:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при получении списка фреймворков' },
      { status: 500 }
    );
  }
}

/**
 * Рекомендация фреймворка на основе данных интервью
 *
 * POST /api/frameworks/recommend
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

  try {
    // Получаем данные из запроса
    const data: InterviewData = await request.json();
    
    // Получаем все фреймворки из базы данных
    const frameworks = await prisma.framework.findMany({
      include: {
        phases: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
    
    // Логируем запрос для диагностики
    logger.info(`Поиск рекомендуемого фреймворка для проекта: ${data.title}`);
    
    // Пытаемся получить рекомендацию от ИИ
    let aiRecommendation = null;
    try {
      // Проверяем, настроен ли OpenAI API
      if (AIService.isOpenAIConfigured()) {
        // Формируем промпт для OpenAI
        const prompt = `
          Я бизнес-аналитик, работающий над новым проектом со следующими параметрами:
          
          Название проекта: ${data.title}
          Бизнес-потребность: ${data.businessNeed || 'Не указано'}
          Ожидаемые результаты: ${data.deliverables || 'Не указано'}
          Длительность: ${data.durationBucket || 'Не указано'}
          Размер команды: ${data.coreTeamSize || 'Не указано'}
          Зрелость процессов: ${data.processMaturity || 'Не указано'}
          Предпочитаемый стиль: ${data.preferredStyle || 'Не указано'}
          Толерантность к риску: ${data.riskTolerance || 'Не указано'}
          
          У меня есть несколько методологий на выбор:
          ${frameworks.map(f => `- ${f.name}: ${f.description}`).join('\n')}
          
          Порекомендуйте мне наиболее подходящую методологию из списка и объясните свой выбор.
          Верните ответ в формате JSON с полями: recommendedFrameworkId, rationale.
        `;
        
        const systemPrompt = `Ты опытный бизнес-аналитик, который помогает выбрать оптимальную методологию для проектов. Ты должен анализировать параметры проекта и подбирать наиболее подходящий фреймворк из предложенного списка. Всегда возвращай результат в формате JSON с полями recommendedFrameworkId и rationale.`;
        
        // Создаем OpenAI клиент и отправляем запрос
        const client = AIService.createOpenAIClient();
        const response = await client.createCompletion(prompt, systemPrompt);
        
        try {
          // Парсим ответ OpenAI
          const parsedResponse = JSON.parse(response);
          aiRecommendation = {
            frameworkId: parsedResponse.recommendedFrameworkId,
            reason: parsedResponse.rationale
          };
          
          logger.info(`ИИ рекомендовал фреймворк: ${aiRecommendation.frameworkId}`);
        } catch (parseError) {
          logger.error('Ошибка при парсинге ответа OpenAI:', parseError);
        }
      }
    } catch (aiError) {
      logger.error('Ошибка при получении рекомендации от ИИ:', aiError);
      // Продолжаем выполнение, используя алгоритмический подход в случае ошибки
    }
    
    // Подбираем фреймворк на основе критериев (алгоритмический подход)
    const scoredFrameworks = frameworks.map(framework => {
      let score = 0;
      const criteria: any = framework.suitabilityCriteria || {};
      
      // Проверяем длительность проекта
      if (criteria.durationMonthsMax && data.durationBucket) {
        const durationMap: Record<string, number> = {
          '≤ 1 мес (Spike/PoC)': 1,
          '1-3 мес': 3,
          '3-6 мес': 6,
          '> 6 мес': 12
        };
        
        const projectDuration = durationMap[data.durationBucket] || 12;
        if (projectDuration <= criteria.durationMonthsMax) {
          score += 20;
        } else {
          score -= 30; // Сильный штраф, если проект не вписывается в максимальную длительность
        }
      }
      
      // Проверяем толерантность к риску
      if (criteria.riskTolerance && data.riskTolerance) {
        if (Array.isArray(criteria.riskTolerance) && criteria.riskTolerance.includes(data.riskTolerance)) {
          score += 15;
        }
      }
      
      // Проверяем предпочитаемый стиль управления
      if (framework.methodologyTag && data.preferredStyle) {
        if (data.preferredStyle === 'Agile/Scrum' && framework.methodologyTag.includes('agile')) {
          score += 25;
        } else if (data.preferredStyle === 'Waterfall' && framework.methodologyTag.includes('waterfall')) {
          score += 25;
        } else if (data.preferredStyle === 'Lean' && framework.methodologyTag.includes('lean')) {
          score += 25;
        }
      }
      
      // Проверяем размер команды
      if (criteria.teamSizeMax && data.coreTeamSize) {
        const teamSizeMap: Record<string, number> = {
          '1-3': 3,
          '4-7': 7,
          '> 7': 15
        };
        
        const teamSize = teamSizeMap[data.coreTeamSize] || 3;
        if (teamSize <= criteria.teamSizeMax) {
          score += 10;
        }
      }
      
      // Проверяем зрелость процессов
      if (criteria.minProcessMaturity && data.processMaturity) {
        const maturityMap: Record<string, number> = {
          'Ничего': 0,
          'Есть описания': 1,
          'Для ключевых': 2,
          'Полные BPMN': 3
        };
        
        const maturity = maturityMap[data.processMaturity] || 0;
        const requiredMaturity = typeof criteria.minProcessMaturity === 'string' 
          ? maturityMap[criteria.minProcessMaturity] || 0
          : criteria.minProcessMaturity;
          
        if (maturity >= requiredMaturity) {
          score += 15;
        } else {
          score -= 20; // Штраф, если зрелость процессов ниже требуемой
        }
      }
      
      // Бонус для фреймворка по умолчанию
      if (framework.isDefault) {
        score += 5;
      }
      
      // Если есть рекомендация от ИИ для этого фреймворка, добавляем значительный бонус
      if (aiRecommendation && aiRecommendation.frameworkId === framework.id) {
        score += 50; // Значительный бонус для рекомендации ИИ
      }
      
      return {
        framework,
        score,
        aiRecommended: aiRecommendation && aiRecommendation.frameworkId === framework.id,
        aiReason: aiRecommendation && aiRecommendation.frameworkId === framework.id ? aiRecommendation.reason : null
      };
    });
    
    // Сортируем фреймворки по оценке (от наивысшей к наименьшей)
    scoredFrameworks.sort((a, b) => b.score - a.score);
    
    // Выбираем лучшие 3 фреймворка
    const recommendedFrameworks = scoredFrameworks
      .filter(item => item.score > 0) // Только положительные оценки
      .slice(0, 3)
      .map(item => ({
        id: item.framework.id,
        name: item.framework.name,
        ruName: item.framework.ruName,
        description: item.framework.description,
        ruDescription: item.framework.ruDescription,
        score: item.score,
        aiRecommended: item.aiRecommended,
        aiReason: item.aiReason,
        phases: item.framework.phases.map(phase => ({
          id: phase.id,
          name: phase.name,
          ruName: phase.ruName,
          order: phase.order,
          durationWeeks: phase.durationWeeks
        }))
      }));
    
    // Если подходящих фреймворков не найдено, возвращаем фреймворк по умолчанию
    if (recommendedFrameworks.length === 0) {
      const defaultFramework = frameworks.find(f => f.isDefault) || frameworks[0];
      if (defaultFramework) {
        recommendedFrameworks.push({
          id: defaultFramework.id,
          name: defaultFramework.name,
          ruName: defaultFramework.ruName,
          description: defaultFramework.description,
          ruDescription: defaultFramework.ruDescription,
          score: 1,
          aiRecommended: false,
          aiReason: null,
          phases: defaultFramework.phases.map(phase => ({
            id: phase.id,
            name: phase.name,
            ruName: phase.ruName,
            order: phase.order,
            durationWeeks: phase.durationWeeks
          }))
        });
      }
    }
    
    // Логируем результаты
    logger.info(`Рекомендованы фреймворки: ${recommendedFrameworks.map(f => f.name).join(', ')}`);
    
    // Возвращаем результаты
    return NextResponse.json({
      success: true,
      data: {
        recommended: recommendedFrameworks,
        aiRecommendation: aiRecommendation ? {
          frameworkId: aiRecommendation.frameworkId,
          reason: aiRecommendation.reason
        } : null
      }
    });
    
  } catch (error) {
    logger.error('Ошибка при рекомендации фреймворка:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при рекомендации фреймворка' },
      { status: 500 }
    );
  }
}