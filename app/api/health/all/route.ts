import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import axios from 'axios';

export async function GET() {
  try {
    const results = {
      app: { status: 'ok' },
      database: { status: 'unknown', details: null },
      parser: { status: 'unknown', details: null },
      storage: { status: 'unknown', details: null }
    };

    // Проверка базы данных
    try {
      // Простой запрос к базе данных - проверка соединения
      await prisma.$queryRaw`SELECT 1`;
      results.database.status = 'ok';
    } catch (dbError: any) {
      results.database.status = 'error';
      results.database.details = dbError.message;
    }

    // Проверка парсера
    try {
      const parserUrl = process.env.PARSER_URL || 'http://localhost:4000/extract-text';
      const healthUrl = parserUrl.replace('/extract-text', '/health');
      
      const parserResponse = await axios.get(healthUrl, { timeout: 5000 });
      
      if (parserResponse.status === 200 && parserResponse.data?.status === 'ok') {
        results.parser.status = 'ok';
      } else {
        results.parser.status = 'warning';
        results.parser.details = 'Сервис парсера доступен, но вернул неожиданный статус';
      }
    } catch (parserError: any) {
      results.parser.status = 'error';
      results.parser.details = parserError.message;
    }

    // Проверка хранилища (GCS)
    try {
      // Здесь можно добавить проверку GCS, но мы просто укажем, что не проверяли
      results.storage.status = 'unknown';
      results.storage.details = 'Не проверяли соединение с GCS';
    } catch (storageError: any) {
      results.storage.status = 'error';
      results.storage.details = storageError.message;
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Ошибка при проверке состояния системы:', error);
    
    return NextResponse.json({
      app: { status: 'error', details: error.message },
      database: { status: 'unknown' },
      parser: { status: 'unknown' },
      storage: { status: 'unknown' }
    }, { status: 500 });
  }
}
