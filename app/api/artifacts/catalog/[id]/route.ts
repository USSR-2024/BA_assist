// app/api/artifacts/catalog/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API:ArtifactsCatalogItem');

// GET /api/artifacts/catalog/:id - Получить информацию о конкретном артефакте
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
  
  const { id } = params;
  
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