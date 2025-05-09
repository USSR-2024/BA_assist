// Скрипт для импорта данных фреймворков, фаз и задач в базу данных
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Путь к JSON-файлам
const FRAMEWORKS_JSON_PATH = path.resolve(__dirname, '../frameworks.json');
const TASKS_JSON_PATH = path.resolve(__dirname, '../tasks.json');
const KEYWORDS_JSON_PATH = path.resolve(__dirname, '../keywords.json');

async function importFrameworks() {
  console.log('Загрузка фреймворков из', FRAMEWORKS_JSON_PATH);
  
  try {
    // Читаем данные из JSON-файлов
    const frameworksData = JSON.parse(fs.readFileSync(FRAMEWORKS_JSON_PATH, 'utf-8'));
    
    if (!frameworksData.frameworks || !Array.isArray(frameworksData.frameworks)) {
      throw new Error('Неверный формат файла frameworks.json, отсутствует массив frameworks');
    }
    
    console.log(`Найдено ${frameworksData.frameworks.length} фреймворков для импорта`);
    
    // Импортируем каждый фреймворк
    for (const framework of frameworksData.frameworks) {
      const { id, name, ruName, description, ruDescription, methodologyTag, phases, isDefault, isSystem, isCustom, suitabilityCriteria } = framework;
      
      console.log(`Импорт фреймворка: ${name} (${id})`);
      
      // Создаем или обновляем фреймворк
      const createdFramework = await prisma.framework.upsert({
        where: { id },
        update: {
          name,
          ruName,
          description,
          ruDescription,
          methodologyTag,
          isDefault: isDefault || false,
          isSystem: isSystem !== undefined ? isSystem : true,
          isCustom: isCustom || false,
          suitabilityCriteria: suitabilityCriteria || {}
        },
        create: {
          id,
          name,
          ruName,
          description,
          ruDescription,
          methodologyTag,
          isDefault: isDefault || false,
          isSystem: isSystem !== undefined ? isSystem : true,
          isCustom: isCustom || false,
          suitabilityCriteria: suitabilityCriteria || {}
        }
      });
      
      // Импортируем фазы фреймворка
      if (phases && Array.isArray(phases)) {
        console.log(`  Найдено ${phases.length} фаз для фреймворка ${id}`);
        
        for (const phase of phases) {
          const { id: phaseId, name, ruName, order, description, ruDescription, durationWeeks } = phase;
          
          console.log(`  Импорт фазы: ${name} (${phaseId})`);
          
          // Создаем или обновляем фазу
          await prisma.phase.upsert({
            where: { id: phaseId },
            update: {
              frameworkId: id,
              name,
              ruName,
              order,
              description: description || null,
              ruDescription: ruDescription || null,
              durationWeeks
            },
            create: {
              id: phaseId,
              frameworkId: id,
              name,
              ruName,
              order,
              description: description || null,
              ruDescription: ruDescription || null,
              durationWeeks
            }
          });
        }
      }
    }
    
    // Импортируем данные об универсальных фазах, если они есть
    if (frameworksData.universalPhases && Array.isArray(frameworksData.universalPhases)) {
      console.log(`Найдено ${frameworksData.universalPhases.length} универсальных фаз`);
      
      // Проверяем, существует ли фреймворк UNIVERSAL, если нет - создаем
      const universalFramework = await prisma.framework.findUnique({ where: { id: 'UNIVERSAL' } });
      
      if (!universalFramework) {
        console.log('Создание универсального фреймворка: UNIVERSAL');
        
        await prisma.framework.create({
          data: {
            id: 'UNIVERSAL',
            name: 'Universal Tasks',
            ruName: 'Универсальные задачи',
            description: 'Tasks that can be used in any framework',
            ruDescription: 'Задачи, которые могут быть использованы в любом фреймворке',
            methodologyTag: ['universal'],
            isDefault: false,
            isSystem: true,
            isCustom: false
          }
        });
      }
      
      // Импортируем универсальные фазы
      for (const phase of frameworksData.universalPhases) {
        const { id: phaseId, name, ruName, description, ruDescription } = phase;
        
        console.log(`  Импорт универсальной фазы: ${name} (${phaseId})`);
        
        // Создаем или обновляем универсальную фазу
        await prisma.phase.upsert({
          where: { id: phaseId },
          update: {
            frameworkId: 'UNIVERSAL',
            name,
            ruName,
            order: 0, // Порядок для универсальных фаз неважен
            description: description || null,
            ruDescription: ruDescription || null,
            durationWeeks: 0 // Длительность для универсальных фаз неважна
          },
          create: {
            id: phaseId,
            frameworkId: 'UNIVERSAL',
            name,
            ruName,
            order: 0,
            description: description || null,
            ruDescription: ruDescription || null,
            durationWeeks: 0
          }
        });
      }
    }
    
    console.log('Импорт фреймворков и фаз успешно завершен');
    return true;
    
  } catch (error) {
    console.error('Ошибка при импорте фреймворков:', error);
    return false;
  }
}

async function importTasks() {
  console.log('Загрузка задач из', TASKS_JSON_PATH);
  
  try {
    // Читаем данные из JSON-файла
    const tasksData = JSON.parse(fs.readFileSync(TASKS_JSON_PATH, 'utf-8'));
    
    if (!tasksData.tasks || !Array.isArray(tasksData.tasks)) {
      throw new Error('Неверный формат файла tasks.json, отсутствует массив tasks');
    }
    
    console.log(`Найдено ${tasksData.tasks.length} задач для импорта`);
    
    // Импортируем каждую задачу
    for (const task of tasksData.tasks) {
      const { 
        taskId, // Обратите внимание: теперь мы используем taskId вместо id
        frameworkId, 
        phaseId, 
        name, 
        ruName, 
        description, 
        ruDescription, 
        artifactIds, 
        dependsOn, 
        estimatedHours, 
        acceptanceCriteria 
      } = task;
      
      console.log(`Импорт задачи: ${name} (${taskId})`);
      
      // Проверяем, что у задачи есть ID
      if (!taskId) {
        console.warn(`  Пропуск: У задачи "${name}" отсутствует taskId`);
        continue;
      }
      
      // Проверяем существование фазы
      const phaseExists = await prisma.phase.findUnique({ where: { id: phaseId } });
      
      if (!phaseExists) {
        console.warn(`  Пропуск: Фаза с ID ${phaseId} не найдена для задачи ${taskId}`);
        continue;
      }
      
      // Создаем или обновляем задачу
      await prisma.frameworkTask.upsert({
        where: { id: taskId }, // Используем taskId для поля id в БД
        update: {
          frameworkId,
          phaseId,
          name,
          ruName,
          description,
          ruDescription,
          estimatedHours: estimatedHours || null,
          acceptanceCriteria: acceptanceCriteria || null,
          artifactIds: artifactIds || [],
          dependsOn: dependsOn || []
        },
        create: {
          id: taskId, // Используем taskId для поля id в БД
          frameworkId,
          phaseId,
          name,
          ruName,
          description,
          ruDescription,
          estimatedHours: estimatedHours || null,
          acceptanceCriteria: acceptanceCriteria || null,
          artifactIds: artifactIds || [],
          dependsOn: dependsOn || []
        }
      });
    }
    
    console.log('Импорт задач успешно завершен');
    return true;
    
  } catch (error) {
    console.error('Ошибка при импорте задач:', error);
    return false;
  }
}

async function importKeywords() {
  console.log('Загрузка ключевых слов из', KEYWORDS_JSON_PATH);
  
  try {
    // Этот функционал будет добавлен позже, так как для ключевых слов 
    // потребуется создать дополнительные модели данных в схеме Prisma
    console.log('Импорт ключевых слов пока не реализован');
    return true;
    
  } catch (error) {
    console.error('Ошибка при импорте ключевых слов:', error);
    return false;
  }
}

async function main() {
  console.log('Начало импорта данных фреймворков и задач...');
  
  try {
    // 1. Импортируем фреймворки и фазы
    const frameworksImported = await importFrameworks();
    
    if (!frameworksImported) {
      throw new Error('Не удалось импортировать фреймворки');
    }
    
    // 2. Импортируем задачи
    const tasksImported = await importTasks();
    
    if (!tasksImported) {
      throw new Error('Не удалось импортировать задачи');
    }
    
    // 3. Импортируем ключевые слова
    const keywordsImported = await importKeywords();
    
    console.log('Импорт данных успешно завершен!');
    
  } catch (error) {
    console.error('Произошла ошибка при импорте данных:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем основную функцию
main();