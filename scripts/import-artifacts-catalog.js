// scripts/import-artifacts-catalog.js
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importArtifactsCatalog() {
  try {
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
    
    // Очищаем существующие данные (опционально)
    console.log('Очищаем существующие данные каталога...');
    await prisma.artifactCatalog.deleteMany({});
    
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
    const result = await prisma.artifactCatalog.createMany({
      data: artifacts,
      skipDuplicates: true
    });
    
    console.log(`Успешно импортировано ${result.count} артефактов из ${artifacts.length}`);
    
  } catch (error) {
    console.error('Ошибка импорта каталога артефактов:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем импорт
importArtifactsCatalog();