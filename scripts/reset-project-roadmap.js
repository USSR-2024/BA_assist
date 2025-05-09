const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Идентификатор проекта, для которого нужно сбросить дорожную карту
const PROJECT_ID = 10;

async function resetProjectRoadmap() {
  try {
    console.log(`Сброс дорожной карты для проекта ${PROJECT_ID}...`);
    
    // Найдем все дорожные карты проекта
    const roadmaps = await prisma.projectRoadmap.findMany({
      where: { projectId: PROJECT_ID }
    });
    
    console.log(`Найдено ${roadmaps.length} дорожных карт для проекта ${PROJECT_ID}`);
    
    // Удаляем каждую дорожную карту и все связанные с ней данные
    for (const roadmap of roadmaps) {
      console.log(`Обработка дорожной карты ${roadmap.id}...`);
      
      // Получим все фазы дорожной карты
      const phases = await prisma.projectPhase.findMany({
        where: { projectRoadmapId: roadmap.id }
      });
      
      console.log(`Найдено ${phases.length} фаз для дорожной карты ${roadmap.id}`);
      
      // Для каждой фазы удаляем связанные задачи
      for (const phase of phases) {
        // Получим все задачи фазы
        const tasks = await prisma.projectTask.findMany({
          where: { projectPhaseId: phase.id }
        });
        
        console.log(`Найдено ${tasks.length} задач для фазы ${phase.id}`);
        
        // Для каждой задачи удаляем связи с артефактами
        for (const task of tasks) {
          // Удаляем связи задач с артефактами
          const deletedArtifactLinks = await prisma.projectTaskArtifact.deleteMany({
            where: { projectTaskId: task.id }
          });
          
          console.log(`Удалено ${deletedArtifactLinks.count} связей с артефактами для задачи ${task.id}`);
        }
        
        // Удаляем все задачи фазы
        const deletedTasks = await prisma.projectTask.deleteMany({
          where: { projectPhaseId: phase.id }
        });
        
        console.log(`Удалено ${deletedTasks.count} задач для фазы ${phase.id}`);
      }
      
      // Удаляем все фазы дорожной карты
      const deletedPhases = await prisma.projectPhase.deleteMany({
        where: { projectRoadmapId: roadmap.id }
      });
      
      console.log(`Удалено ${deletedPhases.count} фаз для дорожной карты ${roadmap.id}`);
      
      // Удаляем саму дорожную карту
      await prisma.projectRoadmap.delete({
        where: { id: roadmap.id }
      });
      
      console.log(`Удалена дорожная карта ${roadmap.id}`);
    }
    
    console.log(`Все дорожные карты для проекта ${PROJECT_ID} успешно удалены`);
    
  } catch (error) {
    console.error('Ошибка при сбросе дорожной карты:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetProjectRoadmap();