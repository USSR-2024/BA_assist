import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import axios from 'axios';
import { authMiddleware } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { ENV } from '@/lib/env';

const logger = createLogger('API:Files:Process');
const PARSER_URL = ENV.PARSER_URL;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Аутентификация запроса
    const authResult = await authMiddleware(req);
    
    if ('success' in authResult === false) {
      return authResult;
    }
    
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    const userId = authResult.userId;
    const fileId = params.id;
    logger.info(`Обработка файла с ID: ${fileId} пользователем: ${userId}`);

    if (!fileId) {
      logger.error('FileID не указан');
      return NextResponse.json({ success: false, error: 'ID файла не указан' }, { status: 400 });
    }

    // Получение информации о файле из БД
    const file = await prisma.file.findUnique({
      where: { id: Number(fileId) },
      include: { project: true }
    });

    if (!file) {
      logger.error(`Файл с ID ${fileId} не найден`);
      return NextResponse.json({ success: false, error: 'Файл не найден' }, { status: 404 });
    }

    logger.info(`Файл найден: ${file.name}, путь: ${file.gcsPath}`);

    // Проверка прав доступа пользователя к проекту
    const userHasAccess = await prisma.project.findFirst({
      where: {
        id: file.projectId,
        users: { some: { id: userId } }
      }
    });

    if (!userHasAccess) {
      logger.error(`Пользователь ${userId} не имеет доступа к проекту ${file.projectId}`);
      return NextResponse.json({ success: false, error: 'Нет прав доступа к этому файлу' }, { status: 403 });
    }

    // Если файл уже обработан, просто возвращаем успех
    if (file.status === 'PARSED') {
      logger.info(`Файл ${fileId} уже обработан`);
      return NextResponse.json({ 
        success: true, 
        message: 'Файл уже обработан',
        fileId: file.id
      });
    }

    // Инициализация GCS
    let storage;
    try {
      const keyFilename = path.resolve(process.cwd(), ENV.GCS_KEY_FILE);
      logger.info(`Инициализация GCS с ключом: ${keyFilename}`);
      
      storage = new Storage({
        projectId: ENV.GCS_PROJECT_ID,
        keyFilename
      });
    } catch (error) {
      logger.error('Ошибка инициализации GCS:', error);
      return NextResponse.json({ success: false, error: 'Ошибка доступа к хранилищу файлов' }, { status: 500 });
    }

    const bucket = ENV.GCS_BUCKET;
    logger.info(`Используется бакет: ${bucket}`);

    // Проверка существования файла в GCS
    let fileExists = false;
    try {
      const [exists] = await storage.bucket(bucket).file(file.gcsPath).exists();
      fileExists = exists;
      
      if (!fileExists) {
        logger.error(`Файл не найден в GCS по пути: ${file.gcsPath}`);
        return NextResponse.json({ success: false, error: 'Файл не найден в хранилище' }, { status: 404 });
      }
      
      logger.info(`Файл существует в GCS по пути: ${file.gcsPath}`);
    } catch (error) {
      logger.error('Ошибка при проверке существования файла в GCS:', error);
      return NextResponse.json({ success: false, error: 'Не удалось проверить наличие файла в хранилище' }, { status: 500 });
    }

    try {
      // Получение подписанного URL для файла
      const [url] = await storage.bucket(bucket).file(file.gcsPath).getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 минут
      });

      logger.info(`Получен подписанный URL для файла`);

      // Проверка доступности парсера
      try {
        const healthUrl = PARSER_URL.replace('/extract-text', '/health');
        logger.info(`Проверка доступности парсера по адресу: ${healthUrl}`);
        await axios.get(healthUrl);
        logger.info('Парсер доступен');
      } catch (error) {
        logger.error('Парсер недоступен:', error);
        return NextResponse.json({ success: false, error: 'Сервис обработки файлов недоступен' }, { status: 503 });
      }

      // Запрос к парсеру
      logger.info(`Отправка запроса к парсеру по адресу: ${PARSER_URL}`);
      const parserResponse = await axios.post(PARSER_URL, { url });
      
      if (!parserResponse.data || !parserResponse.data.text) {
        logger.error('Парсер не вернул текст файла:', parserResponse.data);
        return NextResponse.json({ success: false, error: 'Не удалось извлечь текст из файла' }, { status: 500 });
      }

      const extractedText = parserResponse.data.text;
      logger.info(`Получен текст длиной ${extractedText.length} символов`);

      // Новый путь для обработанного файла
      const newPath = file.gcsPath.replace('incoming', 'processed');
      
      // Используем транзакцию для атомарного обновления данных
      const updatedFile = await prisma.$transaction(async (tx) => {
        // Обновление файла в БД
        const updated = await tx.file.update({
          where: { id: Number(fileId) },
          data: {
            text: extractedText,
            status: 'PARSED'
          }
        });
        
        logger.info(`Файл успешно обновлен в БД, статус: ${updated.status}`);
        return updated;
      });
      
      // Перемещение файла в папку обработанных
      try {
        await storage.bucket(bucket).file(file.gcsPath).copy(storage.bucket(bucket).file(newPath));
        await storage.bucket(bucket).file(file.gcsPath).delete();
        
        logger.info(`Файл перемещен из ${file.gcsPath} в ${newPath}`);
        
        // Обновление пути в БД
        await prisma.file.update({
          where: { id: Number(fileId) },
          data: { gcsPath: newPath }
        });
      } catch (moveError) {
        logger.error('Ошибка при перемещении файла:', moveError);
        // Не прерываем запрос в случае ошибки перемещения, т.к. текст уже извлечен
      }

      // Обновляем саммари проекта
      try {
        await fetch(`${ENV.APP_URL}/api/projects/${file.projectId}/summary`, {
          method: 'POST',
        });
      } catch (summaryError) {
        logger.error('Ошибка при обновлении саммари проекта:', summaryError);
        // Не критичная ошибка, продолжаем выполнение
      }

      logger.info(`Обработка файла ${fileId} успешно завершена`);
      return NextResponse.json({ 
        success: true, 
        message: 'Файл успешно обработан',
        fileId: updatedFile.id
      });
    } catch (error) {
      logger.error('Ошибка при обработке файла:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Произошла ошибка при обработке файла', 
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    logger.error('Необработанная ошибка:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}