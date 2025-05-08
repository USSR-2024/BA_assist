// app/api/auth/first-user/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Подсчитываем количество пользователей в системе
    const userCount = await prisma.user.count();
    
    // Если нет пользователей - это первый пользователь
    const isFirstUser = userCount === 0;
    
    return NextResponse.json({ 
      isFirstUser,
      userCount
    });
  } catch (error) {
    console.error('Ошибка при проверке пользователей:', error);
    return NextResponse.json(
      { error: 'Произошла ошибка при проверке' },
      { status: 500 }
    );
  }
}