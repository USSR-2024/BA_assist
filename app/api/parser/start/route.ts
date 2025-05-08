import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { authMiddleware } from '@/lib/auth';
import { checkRole } from '@/lib/auth';

// Endpoint для проверки состояния парсера
export async function POST(req: NextRequest) {
  try {
    // Аутентифицируем запрос и проверяем права доступа (только администраторы могут выполнять эту операцию)
    const authResult = await checkRole(req, ['OWNER']);
    if (!('success' in authResult) || !authResult.success) {
      return NextResponse.json({ error: 'Недостаточно прав для выполнения операции' }, { status: 403 });
    }
    
    console.log('Получен запрос на проверку сервиса парсера');
    
    // Определяем URL парсера
    const parserUrl = process.env.PARSER_URL || 'http://localhost:4000/extract-text';
    const healthUrl = parserUrl.replace('/extract-text', '/health');
    
    console.log(`Проверка доступности парсера: ${healthUrl}`);
    
    try {
      // Проверяем доступность парсера
      const response = await axios.get(healthUrl, { timeout: 5000 });
      
      if (response.data && response.data.status === 'ok') {
        return NextResponse.json({ 
          success: true, 
          message: 'Сервис парсера работает корректно',
          details: response.data
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          message: 'Сервис парсера доступен, но вернул неожиданный ответ',
          details: response.data
        }, { status: 500 });
      }
    } catch (error) {
      console.error('Ошибка при проверке парсера:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Сервис парсера недоступен',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Ошибка при проверке парсера:', error);
    return NextResponse.json({ 
      error: 'Ошибка при проверке парсера', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}