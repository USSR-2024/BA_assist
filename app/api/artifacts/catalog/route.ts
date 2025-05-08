// app/api/artifacts/catalog/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:ArtifactsCatalog');

// GET /api/artifacts/catalog - Получить каталог артефактов
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

  const url = new URL(request.url);
  const babokArea = url.searchParams.get('babokArea');
  const stage = url.searchParams.get('stage');
  const format = url.searchParams.get('format');
  const search = url.searchParams.get('search');
  const id = url.searchParams.get('id');
  
  // Если указан ID, возвращаем конкретный артефакт
  if (id) {
    try {
      const artifact = await prisma.artifactCatalog.findUnique({
        where: { id }
      });
      
      if (!artifact) {
        return NextResponse.json(
          { success: false, error: 'Артефакт не найден' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true, data: artifact }, { status: 200 });
    } catch (error) {
      logger.error(`Ошибка получения артефакта ${id}:`, error);
      return NextResponse.json(
        { success: false, error: 'Ошибка сервера при получении артефакта' },
        { status: 500 }
      );
    }
  }

  // Иначе возвращаем список артефактов с фильтрацией
  try {
    // Формируем условия для фильтрации
    let whereClause = {};
    
    if (babokArea) {
      whereClause = { ...whereClause, babokArea };
    }
    
    if (stage) {
      whereClause = { ...whereClause, stage };
    }
    
    if (format) {
      whereClause = { ...whereClause, format };
    }
    
    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { id: { contains: search, mode: 'insensitive' } },
          { enName: { contains: search, mode: 'insensitive' } },
          { ruName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // Получаем артефакты из базы
    const artifacts = await prisma.artifactCatalog.findMany({
      where: whereClause,
      orderBy: [
        { babokArea: 'asc' },
        { stage: 'asc' },
        { id: 'asc' }
      ]
    });

    logger.info(`Получено ${artifacts.length} артефактов из каталога`);
    return NextResponse.json({ success: true, data: artifacts }, { status: 200 });
  } catch (error) {
    logger.error('Ошибка получения каталога артефактов:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера при получении каталога артефактов' },
      { status: 500 }
    );
  }
}