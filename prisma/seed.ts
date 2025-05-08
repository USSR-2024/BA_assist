import { PrismaClient } from '@prisma/client';
import { seedBusinessProcesses } from './seeds/business-processes';

const prisma = new PrismaClient();

/**
 * Основная функция для заполнения базы данных начальными данными
 */
async function main() {
  console.log('Запуск заполнения базы данных...');
  
  try {
    // Выполняем заполнение бизнес-процессов
    await seedBusinessProcesses();
    
    // Здесь можно добавить вызовы других seed-функций
    // await seedOtherData();
    
    console.log('Заполнение базы данных успешно завершено!');
  } catch (error) {
    console.error('Ошибка при заполнении базы данных:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем функцию заполнения
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
