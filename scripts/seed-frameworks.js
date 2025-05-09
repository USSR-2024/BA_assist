// Скрипт для начального заполнения базы данных фреймворками и задачами
const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const path = require('path');

const prisma = new PrismaClient();

async function seedFrameworks() {
  console.log('Запуск скрипта импорта фреймворков и задач...');
  
  // Путь к скрипту импорта
  const importScriptPath = path.resolve(__dirname, './import-frameworks.js');
  
  // Запускаем скрипт импорта
  exec(`node ${importScriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Ошибка выполнения: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Ошибка скрипта: ${stderr}`);
      return;
    }
    
    console.log(`Результат импорта: ${stdout}`);
  });
}

async function main() {
  console.log('Начало заполнения базы данных фреймворками и задачами...');
  
  try {
    // Запускаем импорт фреймворков и задач
    await seedFrameworks();
    
    console.log('Скрипт запущен успешно!');
    
  } catch (error) {
    console.error('Произошла ошибка при заполнении базы данных:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем основную функцию
main();