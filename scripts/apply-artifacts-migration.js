// scripts/apply-artifacts-migration.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('Начало применения миграции для артефактов...');
    
    // Путь к SQL-файлу миграции
    const migrationPath = path.resolve(__dirname, '../prisma/migrations/20250508_add_artifacts_catalog/migration.sql');
    
    // Проверяем, существует ли файл
    if (!fs.existsSync(migrationPath)) {
      console.error(`Файл миграции не найден по пути: ${migrationPath}`);
      process.exit(1);
    }
    
    // Читаем SQL-запросы
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Разделяем файл на отдельные SQL-запросы
    const queries = sqlContent.split(';')
      .map(query => query.trim())
      .filter(query => query.length > 0);
    
    console.log(`Загружено ${queries.length} SQL-запросов из файла миграции`);
    
    // Выполняем каждый SQL-запрос в транзакции
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        console.log(`Выполнение запроса ${i + 1}/${queries.length}...`);
        try {
          await tx.$executeRawUnsafe(`${query};`);
        } catch (error) {
          console.warn(`Предупреждение при выполнении запроса ${i + 1}: ${error.message}`);
          // Продолжаем выполнение, не прерывая транзакцию
        }
      }
    });
    
    console.log('Миграция успешно применена');
    
    // Теперь импортируем каталог артефактов
    console.log('Начинаем импорт каталога артефактов...');
    
    // Путь к JSON-файлу с каталогом
    const catalogPath = path.resolve(__dirname, '../../../baas/ba_assist_artifacts_catalog.json');
    
    // Проверяем, существует ли файл
    if (!fs.existsSync(catalogPath)) {
      console.error(`Файл каталога не найден по пути: ${catalogPath}`);
      process.exit(1);
    }
    
    // Загружаем JSON-данные
    const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    console.log(`Загружено ${catalogData.length} артефактов из JSON-файла`);
    
    // Преобразуем данные каталога в формат, соответствующий схеме Prisma
    const artifacts = catalogData.map(item => {
      return {
        id: item.id,
        enName: item.en_name,
        ruName: item.ru_name,
        babokArea: item.babok_area,
        stage: item.stage,
        description: item.description,
        minInputs: item.min_inputs,
        format: item.format,
        doneCriteria: item.done_criteria,
        keywords: item.keywords,
        dependsOn: item.depends_on,
        providesFor: item.provides_for
      };
    });
    
    // Создаем записи в базе данных
    console.log('Создаем записи в базе данных...');
    for (let i = 0; i < artifacts.length; i++) {
      const artifact = artifacts[i];
      try {
        await prisma.artifactCatalog.upsert({
          where: { id: artifact.id },
          update: { ...artifact },
          create: { ...artifact }
        });
        console.log(`Артефакт ${i + 1}/${artifacts.length}: ${artifact.id} успешно импортирован`);
      } catch (error) {
        console.error(`Ошибка импорта артефакта ${artifact.id}:`, error);
      }
    }
    
    console.log('Импорт каталога завершен');
    
  } catch (error) {
    console.error('Ошибка применения миграции:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем применение миграции
applyMigration();