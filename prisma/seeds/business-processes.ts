import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Создает начальные бизнес-процессы для приложения
 */
async function seedBusinessProcesses() {
  console.log('Создание начальных бизнес-процессов...');
  
  try {
    // Проверяем, есть ли уже записи
    const count = await prisma.businessProcess.count();
    
    if (count > 0) {
      console.log(`Бизнес-процессы уже существуют (${count} записей). Пропускаем создание.`);
      return;
    }
    
    // Корневые бизнес-процессы
    const clientProcess = await prisma.businessProcess.create({
      data: {
        title: 'Работа с клиентами',
        description: 'Процессы взаимодействия с клиентами компании'
      }
    });
    
    const productProcess = await prisma.businessProcess.create({
      data: {
        title: 'Разработка продукта',
        description: 'Процессы создания и улучшения продукта'
      }
    });
    
    const financialProcess = await prisma.businessProcess.create({
      data: {
        title: 'Финансы и юридические вопросы',
        description: 'Финансовые и юридические аспекты деятельности компании'
      }
    });
    
    // Дочерние процессы для "Работа с клиентами"
    await prisma.businessProcess.createMany({
      data: [
        {
          title: 'Привлечение клиентов',
          description: 'Маркетинг, реклама, лидогенерация',
          parentId: clientProcess.id
        },
        {
          title: 'Онбординг клиентов',
          description: 'Процесс знакомства новых клиентов с продуктом',
          parentId: clientProcess.id
        },
        {
          title: 'Поддержка клиентов',
          description: 'Обработка обращений, техническая поддержка',
          parentId: clientProcess.id
        }
      ]
    });
    
    // Дочерние процессы для "Разработка продукта"
    await prisma.businessProcess.createMany({
      data: [
        {
          title: 'Сбор требований',
          description: 'Выявление и документирование требований к продукту',
          parentId: productProcess.id
        },
        {
          title: 'Проектирование',
          description: 'Разработка архитектуры и дизайна продукта',
          parentId: productProcess.id
        },
        {
          title: 'Разработка',
          description: 'Непосредственное создание продукта',
          parentId: productProcess.id
        },
        {
          title: 'Тестирование',
          description: 'Проверка качества и соответствия требованиям',
          parentId: productProcess.id
        },
        {
          title: 'Релиз',
          description: 'Выпуск продукта на рынок',
          parentId: productProcess.id
        }
      ]
    });
    
    // Дочерние процессы для "Финансы и юридические вопросы"
    await prisma.businessProcess.createMany({
      data: [
        {
          title: 'Бюджетирование',
          description: 'Планирование и контроль финансовых ресурсов',
          parentId: financialProcess.id
        },
        {
          title: 'Отчетность',
          description: 'Подготовка финансовой отчетности',
          parentId: financialProcess.id
        },
        {
          title: 'Контракты',
          description: 'Работа с договорами и юридическими документами',
          parentId: financialProcess.id
        }
      ]
    });
    
    console.log('Начальные бизнес-процессы успешно созданы!');
  } catch (error) {
    console.error('Ошибка при создании бизнес-процессов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Если файл запущен напрямую (не импортирован)
if (require.main === module) {
  seedBusinessProcesses();
}

export { seedBusinessProcesses };
