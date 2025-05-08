// app/api/ai/status/route.ts
import { NextResponse } from 'next/server';
import { ENV } from '@/lib/env';
import { AIService } from '@/lib/ai-service';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:AI:Status');

/**
 * Возвращает информацию о статусе интеграции с OpenAI
 * GET /api/ai/status
 */
export async function GET() {
  try {
    const isEnabled = AIService.isOpenAIConfigured();
    const model = ENV.OPENAI_MODEL;
    
    return NextResponse.json({
      success: true,
      enabled: isEnabled,
      model: model
    }, { status: 200 });
  } catch (error) {
    logger.error('Ошибка при запросе статуса AI:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при получении статуса AI' },
      { status: 500 }
    );
  }
}