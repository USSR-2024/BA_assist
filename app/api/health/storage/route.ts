import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

// Endpoint для проверки доступности Google Cloud Storage
export async function GET(req: NextRequest) {
  try {
    console.log('Проверка соединения с Google Cloud Storage...');
    
    const bucketName = process.env.GCS_BUCKET || 'baassist-files';
    const keyFilename = path.resolve(process.cwd(), process.env.GCS_KEY_FILE || 'keys/gcs-service-account.json');
    
    console.log(`Попытка инициализации GCS с ключом: ${keyFilename}`);
    console.log(`Используемый бакет: ${bucketName}`);
    
    // Проверим существование файла ключа
    if (!fs.existsSync(keyFilename)) {
      console.error(`Файл ключа не найден: ${keyFilename}`);
      return NextResponse.json({ 
        status: 'error',
        message: 'Файл ключа Google Cloud Storage не найден',
        keyFile: keyFilename
      }, { status: 500 });
    }
    
    // Если установлен режим эмуляции GCS
    if (process.env.USE_REAL_GCS === 'false') {
      console.log('Режим эмуляции GCS активен, возвращаем симулированный ответ');
      return NextResponse.json({ 
        status: 'ok',
        message: 'Эмуляция Google Cloud Storage активна',
        bucket: {
          name: bucketName,
          emulated: true
        }
      });
    }
    
    // Инициализируем GCS с указанным ключом
    const storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      keyFilename
    });
    
    // Проверяем существование бакета
    const [bucketExists] = await storage.bucket(bucketName).exists();
    
    if (bucketExists) {
      console.log(`Бакет ${bucketName} найден`);
      
      // Проверяем доступность бакета через операцию получения метаданных
      try {
        const [metadata] = await storage.bucket(bucketName).getMetadata();
        
        console.log('Метаданные бакета получены:', {
          name: metadata.name,
          location: metadata.location,
          storageClass: metadata.storageClass
        });
        
        return NextResponse.json({ 
          status: 'ok',
          message: 'Google Cloud Storage доступен',
          bucket: {
            name: metadata.name,
            location: metadata.location,
            storageClass: metadata.storageClass
          }
        });
      } catch (metadataError) {
        console.error('Ошибка при получении метаданных бакета:', metadataError);
        return NextResponse.json({
          status: 'error',
          message: 'Бакет существует, но не удалось получить метаданные',
          error: metadataError instanceof Error ? metadataError.message : String(metadataError)
        }, { status: 500 });
      }
    } else {
      console.log(`Бакет ${bucketName} не найден. Попытка создания...`);
      
      // Если бакет не существует, пробуем его создать
      try {
        await storage.createBucket(bucketName);
        console.log(`Бакет ${bucketName} успешно создан`);
        
        return NextResponse.json({ 
          status: 'ok',
          message: 'Бакет успешно создан',
          bucket: {
            name: bucketName
          }
        });
      } catch (createError) {
        console.error('Ошибка при создании бакета:', createError);
        return NextResponse.json({ 
          status: 'error',
          message: 'Не удалось создать бакет',
          error: createError instanceof Error ? createError.message : String(createError)
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Ошибка при проверке соединения с Google Cloud Storage:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Ошибка подключения к Google Cloud Storage',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}