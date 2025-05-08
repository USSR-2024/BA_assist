import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Endpoint для проверки доступности базы данных
export async function GET(req: NextRequest) {
  try {
    console.log('Проверка соединения с базой данных...');
    
    // Выполняем простой запрос к базе данных
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    console.log('Соединение с базой данных установлено:', result);
    
    return NextResponse.json({ 
      status: 'ok',
      message: 'База данных доступна'
    });
  } catch (error) {
    console.error('Ошибка при проверке соединения с базой данных:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Ошибка подключения к базе данных',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}