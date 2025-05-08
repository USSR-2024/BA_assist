import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    // Проверяем авторизацию пользователя
    const authResult = await authMiddleware(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const userId = authResult.userId;
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    // Валидация
    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: 'ID проекта не указан' }, { status: 400 });
    }

    // Проверяем доступ к проекту
    const project = await prisma.project.findFirst({
      where: {
        id: Number(projectId),
        users: { some: { id: userId } }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден или у вас нет доступа' }, { status: 403 });
    }

    // Проверяем тип файла
    const fileName = file.name;
    const fileExtension = path.extname(fileName).toLowerCase();
    const allowedExtensions = ['.docx', '.doc', '.pdf', '.txt'];

    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ 
        error: 'Неподдерживаемый тип файла',
        message: `Поддерживаемые типы файлов: ${allowedExtensions.join(', ')}`
      }, { status: 400 });
    }

    // Проверяем размер файла (максимум 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Файл слишком большой',
        message: 'Максимальный размер файла - 100MB'
      }, { status: 400 });
    }

    // Получаем бинарные данные файла
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Инициализируем Google Cloud Storage
    let storage;
    try {
      const keyFilename = path.resolve(process.cwd(), process.env.GCS_KEY_FILE || 'keys/gcs-service-account.json');
      
      storage = new Storage({
        projectId: process.env.GCS_PROJECT_ID,
        keyFilename
      });
    } catch (error) {
      console.error('Ошибка при инициализации GCS:', error);
      return NextResponse.json({ error: 'Ошибка при доступе к хранилищу файлов' }, { status: 500 });
    }

    const bucket = process.env.GCS_BUCKET || 'baassist-files';
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const filePath = `incoming/project-${projectId}/${uniqueFileName}`;
    const gcsFile = storage.bucket(bucket).file(filePath);

    try {
      // Загружаем файл в GCS
      await gcsFile.save(buffer, {
        metadata: {
          contentType: file.type
        }
      });

      console.log(`Файл успешно загружен в GCS: ${filePath}`);

      // Сохраняем информацию о файле в базе данных
      const dbFile = await prisma.file.create({
        data: {
          projectId: Number(projectId),
          name: fileName,
          gcsPath: filePath,
          size: file.size,
          status: 'UPLOADED'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Файл успешно загружен',
        fileId: dbFile.id,
        fileName: dbFile.name
      });
    } catch (uploadError) {
      console.error('Ошибка при загрузке файла:', uploadError);
      return NextResponse.json({ 
        error: 'Ошибка при загрузке файла в хранилище', 
        details: uploadError instanceof Error ? uploadError.message : String(uploadError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Необработанная ошибка при загрузке файла:', error);
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Конфигурация для загрузки больших файлов
export const config = {
  api: {
    bodyParser: false,
  },
};