import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Endpoint для проверки доступности парсера
export async function GET(req: NextRequest) {
  try {
    const PARSER_URL = process.env.PARSER_URL || 'http://localhost:4000/extract-text';
    const parserHealthUrl = PARSER_URL.replace('/extract-text', '/health');
    
    console.log(`Проверка доступности парсера по адресу: ${parserHealthUrl}`);
    
    try {
      const response = await axios.get(parserHealthUrl);
      if (response.status === 200) {
        return NextResponse.json({ 
          status: 'ok',
          message: 'Сервис обработки файлов доступен'
        });
      } else {
        throw new Error(`Неожиданный статус ответа: ${response.status}`);
      }
    } catch (error) {
      console.error('Ошибка при проверке доступности парсера:', error);
      return NextResponse.json({ 
        status: 'error',
        message: 'Сервис обработки файлов недоступен',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Необработанная ошибка:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Внутренняя ошибка сервера',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}