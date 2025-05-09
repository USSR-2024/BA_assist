const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Путь к JSON-файлу с задачами
const TASKS_JSON_PATH = path.resolve(__dirname, '../bpmre-tasks.json');

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
        taskId, 
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
        where: { id: taskId },
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
          id: taskId,
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
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем функцию импорта задач
importTasks().catch(console.error);