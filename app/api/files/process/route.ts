import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import axios from 'axios';
import { authMiddleware } from '@/lib/auth';

const PARSER_URL = process.env.PARSER_URL || 'http://localhost:4000/extract-text';

export async function POST(req: NextRequest) {
  try {
    // Authenticate request
    const authResult = await authMiddleware(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const userId = authResult.userId;
    console.log(`Обработка файла пользователем: ${userId}`);

    // Parse request body
    const body = await req.json();
    const { fileId } = body;

    if (!fileId) {
      console.error('FileID не указан');
      return NextResponse.json({ error: 'ID файла не указан' }, { status: 400 });
    }

    console.log(`Начинаем обработку файла с ID: ${fileId}`);

    // Get file details from database
    const file = await prisma.file.findUnique({
      where: { id: Number(fileId) },
      include: { project: true }
    });

    if (!file) {
      console.error(`Файл с ID ${fileId} не найден`);
      return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
    }

    console.log(`Файл найден: ${file.name}, путь: ${file.gcsPath}`);

    // Check user has access to the project
    const userHasAccess = await prisma.project.findFirst({
      where: {
        id: file.projectId,
        users: { some: { id: userId } }
      }
    });

    if (!userHasAccess) {
      console.error(`Пользователь ${userId} не имеет доступа к проекту ${file.projectId}`);
      return NextResponse.json({ error: 'Нет прав доступа к этому файлу' }, { status: 403 });
    }

    // Initialize GCS
    let storage;
    try {
      const keyFilename = path.resolve(process.cwd(), process.env.GCS_KEY_FILE || 'keys/gcs-service-account.json');
      console.log(`Попытка инициализации GCS с ключом: ${keyFilename}`);
      
      storage = new Storage({
        projectId: process.env.GCS_PROJECT_ID,
        keyFilename
      });
    } catch (error) {
      console.error('Ошибка инициализации GCS:', error);
      return NextResponse.json({ error: 'Ошибка доступа к хранилищу файлов' }, { status: 500 });
    }

    const bucket = process.env.GCS_BUCKET || 'baassist-files';
    console.log(`Используется бакет: ${bucket}`);

    // Get signed URL for the file
    try {
      const [url] = await storage.bucket(bucket).file(file.gcsPath).getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      });

      console.log(`Получен подписанный URL для файла: ${url.substring(0, 100)}...`);

      // Отправляем URL к парсеру для обработки
      console.log(`Отправляем запрос к парсеру по адресу: ${PARSER_URL}`);
      console.log(`Тип файла: ${file.name.split('.').pop()}`);
      
      let parserResponse;
      try {
        parserResponse = await axios.post(PARSER_URL, { 
          url,
          fileName: file.name // Передаем имя файла для более точного определения типа
        });
        
        if (!parserResponse.data || !parserResponse.data.text) {
          console.error('Парсер не вернул текст файла:', parserResponse.data);
          return NextResponse.json({ error: 'Не удалось извлечь текст из файла' }, { status: 500 });
        }

        console.log(`Получен текст длиной ${parserResponse.data.text.length} символов`);
        console.log(`Определена кодировка: ${parserResponse.data.encoding || 'не определена'}`);
      } catch (parserError) {
        console.error('Ошибка при обращении к парсер-сервису:', parserError);
        return NextResponse.json({ 
          error: 'Ошибка при обработке файла парсером', 
          details: parserError instanceof Error ? parserError.message : String(parserError)
        }, { status: 500 });
      }

      // Update file in database
      const updatedFile = await prisma.file.update({
        where: { id: Number(fileId) },
        data: {
          text: parserResponse.data.text,
          status: 'PARSED'
        }
      });

      console.log(`Файл успешно обновлен в БД, статус: ${updatedFile.status}`);

      // Move file to processed folder
      const newPath = file.gcsPath.replace('incoming', 'processed');
      
      try {
        await storage.bucket(bucket).file(file.gcsPath).copy(storage.bucket(bucket).file(newPath));
        await storage.bucket(bucket).file(file.gcsPath).delete();
        
        console.log(`Файл перемещен из ${file.gcsPath} в ${newPath}`);
        
        // Update GCS path in database
        await prisma.file.update({
          where: { id: Number(fileId) },
          data: { gcsPath: newPath }
        });
      } catch (moveError) {
        console.error('Ошибка при перемещении файла:', moveError);
        // We don't fail the request if the move fails, since the text has been extracted
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Файл успешно обработан',
        fileId: updatedFile.id
      });
    } catch (error) {
      console.error('Ошибка при обработке файла:', error);
      return NextResponse.json({ 
        error: 'Произошла ошибка при обработке файла', 
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Необработанная ошибка:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}