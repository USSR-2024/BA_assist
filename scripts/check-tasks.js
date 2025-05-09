const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTasks() {
  try {
    // Проверяем количество задач в таблице FrameworkTask
    const frameworkTaskCount = await prisma.frameworkTask.count();
    console.log('Количество задач в таблице FrameworkTask:', frameworkTaskCount);

    // Если есть задачи, проверим несколько из них
    if (frameworkTaskCount > 0) {
      const sampleTasks = await prisma.frameworkTask.findMany({
        take: 3
      });
      console.log('Пример задач:', JSON.stringify(sampleTasks, null, 2));
    }

    // Проверяем количество задач для каждого фреймворка
    const frameworks = await prisma.framework.findMany({
      include: {
        _count: {
          select: {
            phases: true
          }
        }
      }
    });

    console.log('\nСтатистика по фреймворкам:');
    for (const framework of frameworks) {
      // Получаем фазы для фреймворка
      const phases = await prisma.phase.findMany({
        where: { frameworkId: framework.id },
        include: {
          _count: {
            select: {
              tasks: true
            }
          }
        }
      });

      // Считаем общее количество задач для фреймворка
      let totalTasksForFramework = 0;
      for (const phase of phases) {
        totalTasksForFramework += phase._count.tasks;
      }

      console.log(`- Фреймворк ${framework.name} (${framework.id}): ${framework._count.phases} фаз, ${totalTasksForFramework} задач`);
      
      // Выводим детали по фазам
      for (const phase of phases) {
        console.log(`  - Фаза ${phase.name} (${phase.id}): ${phase._count.tasks} задач`);
      }
    }

  } catch (error) {
    console.error('Ошибка при проверке задач:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTasks().catch(console.error);