import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import prisma from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { ENV } from '@/lib/env';
import { ArtifactClassifier } from '@/lib/artifact-classifier';
import path from 'path';
import fs from 'fs';

const logger = createLogger('API:Upload');

export async function POST(req: NextRequest) {
  try {
    logger.info('Начинаем обработку запроса на загрузку файла');
    
    // Проверка аутентификации пользователя
    const authResult = await authMiddleware(req);
    
    if ('success' in authResult === false) {
      return authResult;
    }
    
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }
    
    const userId = authResult.userId;
    const formData = await req.formData();
    const projectId = formData.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ success: false, error: 'ID проекта не указан' }, { status: 400 });
    }
    
    // Проверка проекта и прав доступа
    const project = await prisma.project.findFirst({
      where: {
        id: Number(projectId),
        users: {
          some: {
            id: userId
          }
        }
      },
    });
    
    if (!project) {
      return NextResponse.json({ success: false, error: 'Проект не найден или нет доступа' }, { status: 404 });
    }
    
    // Получение файла из FormData
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ success: false, error: 'Файл не найден в запросе' }, { status: 400 });
    }
    
    // Подготовка данных о файле
    const projectIdNum = Number(projectId);
    const fileName = file.name;
    const fileSize = file.size;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = path.extname(fileName);
    
    // Используем безопасное кодирование имени файла
    const fileNameWithoutExt = path.basename(fileName, fileExtension);
    const safeFileName = encodeURIComponent(fileNameWithoutExt)
      .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16))
      .replace(/%/g, '_'); // Заменяем % на _ для лучшей читаемости
    
    const randomId = Math.random().toString(36).substring(2, 15);
    const gcsFileName = `incoming/${projectIdNum}/${randomId}-${safeFileName}${fileExtension}`;
    
    logger.info(`Подготовка к загрузке файла: ${fileName} (${fileSize} байт)`);
    logger.info(`GCS путь: ${gcsFileName}`);
    
    try {
      // Проверка существования ключа GCS
      const keyFilePath = ENV.GCS_KEY_FILE;
      const absoluteKeyPath = path.resolve(process.cwd(), keyFilePath);
      
      if (!fs.existsSync(absoluteKeyPath)) {
        logger.error(`Файл ключа GCS не найден по пути: ${absoluteKeyPath}`);
        
        // Используем транзакцию для сохранения в БД
        const dbFile = await prisma.$transaction(async (tx) => {
          return await tx.file.create({
            data: {
              projectId: projectIdNum,
              name: fileName,
              gcsPath: gcsFileName,
              size: fileSize,
              status: 'UPLOADED',
            },
          });
        });
        
        logger.info(`Файл сохранен только в БД с ID: ${dbFile.id}`);
        
        return NextResponse.json({ 
          success: true, 
          fileId: dbFile.id,
          warning: 'Файл сохранен в БД, но не загружен в облако из-за проблем с настройками GCS'
        });
      }
      
      // Инициализация Google Cloud Storage
      const storage = new Storage({
        keyFilename: absoluteKeyPath,
        projectId: ENV.GCS_PROJECT_ID,
      });
      
      const bucketName = ENV.GCS_BUCKET;
      const bucket = storage.bucket(bucketName);
      
      // Проверка существования бакета
      const [bucketExists] = await bucket.exists();
      if (!bucketExists) {
        logger.warn(`Бакет "${bucketName}" не существует, попытка создать...`);
        try {
          await storage.createBucket(bucketName);
          logger.info(`Бакет "${bucketName}" успешно создан`);
        } catch (bucketError) {
          logger.error(`Не удалось создать бакет:`, bucketError);
          throw new Error(`Не удалось создать бакет: ${bucketError instanceof Error ? bucketError.message : String(bucketError)}`);
        }
      }
      
      // Используем транзакцию для атомарной операции
      const dbFile = await prisma.$transaction(async (tx) => {
        // Классифицируем файл
        const classificationResult = await ArtifactClassifier.classifyFile(fileName);
        
        // Определяем стадию артефакта, если есть совпадение
        let artifactStage = null;
        let artifactFormat = null;
        
        if (classificationResult.artifactId && classificationResult.confidence > 0.3) {
          artifactStage = await ArtifactClassifier.getStageForArtifact(classificationResult.artifactId);
          
          // Получаем формат из расширения файла
          const fileExt = path.extname(fileName).toLowerCase();
          artifactFormat = ArtifactClassifier.getFormatFromExtension(fileExt);
          
          logger.info(`Файл классифицирован как артефакт: ${classificationResult.artifactId} (стадия: ${artifactStage})`);
        }
        
        // Создаем метаданные о классификации
        const metadata = {
          classification: {
            result: classificationResult.artifactId,
            confidence: classificationResult.confidence,
            possibleMatches: classificationResult.possibleMatches
          }
        };
        
        // Создаем запись в БД
        const newFile = await tx.file.create({
          data: {
            projectId: projectIdNum,
            name: fileName,
            gcsPath: gcsFileName,
            size: fileSize,
            status: 'UPLOADED',
            // Добавляем информацию о классификации
            artifactId: classificationResult.confidence > 0.3 ? classificationResult.artifactId : null,
            artifactStage: artifactStage as any,
            isArtifact: classificationResult.confidence > 0.3,
            metadata: metadata
          },
        });
        
        // Если файл классифицирован как артефакт с высокой уверенностью, создаем запись в ProjectArtifact
        if (classificationResult.artifactId && classificationResult.confidence > 0.5 && artifactStage && artifactFormat) {
          // Проверяем, существует ли уже такой артефакт в проекте
          const existingArtifact = await tx.projectArtifact.findFirst({
            where: {
              projectId: projectIdNum,
              artifactId: classificationResult.artifactId
            }
          });
          
          if (!existingArtifact) {
            // Создаем новую запись проектного артефакта
            await tx.projectArtifact.create({
              data: {
                projectId: projectIdNum,
                artifactId: classificationResult.artifactId,
                fileId: newFile.id,
                status: 'DRAFT',
                stage: artifactStage as any,
                format: artifactFormat as any,
                assignedToUserId: userId
              }
            });
            
            logger.info(`Создан новый проектный артефакт: ${classificationResult.artifactId}`);
          } else {
            // Обновляем существующий артефакт
            await tx.projectArtifact.update({
              where: { id: existingArtifact.id },
              data: {
                fileId: newFile.id,
                status: 'DRAFT',
                version: { increment: 1 }
              }
            });
            
            logger.info(`Обновлен существующий проектный артефакт: ${classificationResult.artifactId}`);
          }
        }
        
        return newFile;
      });
      
      logger.info(`Запись о файле создана в БД с ID: ${dbFile.id}`);
      
      // Загрузка файла в GCS
      const blob = bucket.file(gcsFileName);
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: file.type,
          metadata: {
            originalName: fileName,
            uploadedBy: userId,
            projectId: String(projectId)
          }
        },
      });
      
      try {
        await new Promise((resolve, reject) => {
          blobStream.on('error', (err) => {
            logger.error(`Ошибка при загрузке файла в GCS:`, err);
            reject(err);
          });
          
          blobStream.on('finish', () => {
            logger.info(`Файл успешно загружен в GCS: ${gcsFileName}`);
            resolve(true);
          });
          
          blobStream.end(fileBuffer);
        });
        
        logger.info(`Файл полностью загружен в GCS и сохранен в БД`);
        
        // Формируем ответ с информацией о классификации
        const response: any = { 
          success: true, 
          fileId: dbFile.id,
          message: 'Файл успешно загружен'
        };
        
        // Если файл был классифицирован, добавляем информацию
        if (dbFile.artifactId && dbFile.isArtifact) {
          // Получаем информацию об артефакте
          const artifactInfo = await prisma.artifactCatalog.findUnique({
            where: { id: dbFile.artifactId }
          });
          
          if (artifactInfo) {
            response.classification = {
              artifactId: dbFile.artifactId,
              artifactName: artifactInfo.ruName,
              stage: dbFile.artifactStage,
              isArtifact: true
            };
            
            response.message = `Файл успешно загружен и классифицирован как "${artifactInfo.ruName}"`;
          }
        }
        
        return NextResponse.json(response);
      } catch (uploadError) {
        logger.error(`Ошибка при потоковой передаче в GCS:`, uploadError);
        
        // Файл уже сохранен в БД, возвращаем предупреждение
        return NextResponse.json({ 
          success: true, 
          fileId: dbFile.id,
          warning: 'Файл сохранен в базе данных, но возникла ошибка при загрузке в облако: ' + 
            (uploadError instanceof Error ? uploadError.message : String(uploadError))
        });
      }
    } catch (gcsError) {
      logger.error(`Ошибка GCS:`, gcsError);
      
      // Создание записи о файле в БД даже при ошибке GCS
      try {
        const dbFile = await prisma.file.create({
          data: {
            projectId: projectIdNum,
            name: fileName,
            gcsPath: gcsFileName,
            size: fileSize,
            status: 'UPLOADED',
          },
        });
        
        logger.info(`Файл сохранен в БД с ID: ${dbFile.id} (без загрузки в GCS)`);
        
        return NextResponse.json({ 
          success: true, 
          fileId: dbFile.id,
          warning: 'Файл сохранен в базе данных, но не загружен в облако из-за ошибки: ' + 
            (gcsError instanceof Error ? gcsError.message : String(gcsError))
        });
      } catch (dbError) {
        logger.error(`Ошибка при сохранении в БД:`, dbError);
        return NextResponse.json({ 
          success: false,
          error: 'Не удалось сохранить файл ни в облако, ни в базу данных' 
        }, { status: 500 });
      }
    }
  } catch (error) {
    logger.error('Критическая ошибка при загрузке файла:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Произошла ошибка при загрузке файла: ' + 
        (error instanceof Error ? error.message : 'неизвестная ошибка') 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}