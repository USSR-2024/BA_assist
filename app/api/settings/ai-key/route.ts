// app/api/settings/ai-key/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, checkRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';
import { AIService, OpenAIModel, OpenAISettings } from '@/lib/ai-service';

const logger = createLogger('API:Settings:AI-Key');

/**
 * Сохраняет настройки OpenAI (API-ключ и модель)
 * POST /api/settings/ai-key
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
  
  // Проверяем, что пользователь является владельцем
  const roleError = await checkRole(request, ['OWNER']);
  if (roleError) return roleError;

  try {
    const { apiKey, model, temperature, maxTokens } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API-ключ не указан' },
        { status: 400 }
      );
    }
    
    // Проверка валидности модели
    if (model && !Object.values(OpenAIModel).includes(model as OpenAIModel)) {
      return NextResponse.json(
        { success: false, error: 'Указана неподдерживаемая модель' },
        { status: 400 }
      );
    }
    
    // Проверка валидности параметров
    if (temperature && (temperature < 0 || temperature > 1)) {
      return NextResponse.json(
        { success: false, error: 'Параметр temperature должен быть от 0 до 1' },
        { status: 400 }
      );
    }
    
    if (maxTokens && (maxTokens < 100 || maxTokens > 4000)) {
      return NextResponse.json(
        { success: false, error: 'Параметр maxTokens должен быть от 100 до 4000' },
        { status: 400 }
      );
    }
    
    const userId = authResult.userId;
    
    // Формируем настройки OpenAI
    const settings: OpenAISettings = {
      apiKey,
      model: (model as OpenAIModel) || OpenAIModel.GPT3_5_TURBO,
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 1500
    };
    
    // Сохраняем настройки OpenAI для пользователя
    await AIService.saveOpenAISettings(userId, settings);
    
    logger.info(`Пользователь ${userId} обновил настройки OpenAI (модель: ${settings.model})`);
    
    return NextResponse.json({
      success: true,
      message: 'Настройки OpenAI успешно сохранены'
    }, { status: 200 });
  } catch (error) {
    logger.error('Ошибка при сохранении настроек OpenAI:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при сохранении настроек OpenAI' },
      { status: 500 }
    );
  }
}

/**
 * Получает настройки OpenAI для текущего пользователя
 * GET /api/settings/ai-key
 */
export async function GET(request: NextRequest) {
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
    const userId = authResult.userId;
    
    // Получаем настройки OpenAI для пользователя
    const settings = await AIService.getOpenAISettings(userId);
    
    // В продакшене не возвращаем сам ключ, только маскированную версию
    // и информацию о модели
    const hasKey = !!settings.apiKey;
    
    return NextResponse.json({
      success: true,
      hasKey,
      model: settings.model,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      // Для защиты API-ключа возвращаем только маскированную версию
      maskedKey: hasKey ? `${settings.apiKey?.substring(0, 3)}...${settings.apiKey?.substring(settings.apiKey.length - 4)}` : null
    }, { status: 200 });
  } catch (error) {
    logger.error('Ошибка при получении настроек OpenAI:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при получении настроек OpenAI' },
      { status: 500 }
    );
  }
}