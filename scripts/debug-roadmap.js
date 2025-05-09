const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugRoadmap() {
  try {
    console.log("====== DEBUGGING ROADMAP CREATION ======");
    
    // Проверяем наличие фреймворка BPM Re-engineering
    const framework = await prisma.framework.findUnique({
      where: { id: 'FR-BPMRE' },
      include: {
        phases: {
          include: {
            tasks: true
          }
        }
      }
    });
    
    if (!framework) {
      console.log("❌ Фреймворк FR-BPMRE не найден в базе данных");
      return;
    }
    
    console.log(`✅ Фреймворк найден: ${framework.name} (${framework.id})`);
    console.log(`   Фаз: ${framework.phases.length}`);
    
    // Проверяем наличие фаз
    let hasTasks = false;
    for (const phase of framework.phases) {
      console.log(`   - Фаза ${phase.name} (${phase.id}): ${phase.tasks.length} задач`);
      if (phase.tasks.length > 0) {
        hasTasks = true;
        console.log(`     Пример задачи: ${phase.tasks[0].name} (${phase.tasks[0].id})`);
      }
    }
    
    if (!hasTasks) {
      console.log("❌ Задачи не найдены для фаз фреймворка FR-BPMRE");
    }
    
    // Проверяем наличие задач напрямую
    const tasksForFramework = await prisma.frameworkTask.findMany({
      where: { frameworkId: 'FR-BPMRE' }
    });
    
    console.log(`✅ Задач для фреймворка FR-BPMRE найдено непосредственно в таблице: ${tasksForFramework.length}`);
    
    if (tasksForFramework.length > 0) {
      console.log("   Проверяем связи задач с фазами:");
      
      // Группируем задачи по фазам
      const tasksByPhase = tasksForFramework.reduce((acc, task) => {
        if (!acc[task.phaseId]) {
          acc[task.phaseId] = [];
        }
        acc[task.phaseId].push(task);
        return acc;
      }, {});
      
      for (const phaseId in tasksByPhase) {
        const phase = await prisma.phase.findUnique({ where: { id: phaseId } });
        if (phase) {
          console.log(`   - Фаза ${phase.name} (${phaseId}): ${tasksByPhase[phaseId].length} задач`);
        } else {
          console.log(`   - ❌ Фаза с ID ${phaseId} не найдена, но к ней привязано ${tasksByPhase[phaseId].length} задач`);
        }
      }
    }
    
    // Проверяем, есть ли дорожные карты для проекта 10
    const roadmaps = await prisma.projectRoadmap.findMany({
      where: { projectId: 10 },
      include: {
        phases: {
          include: {
            tasks: true
          }
        }
      }
    });
    
    console.log(`\n✅ Дорожных карт для проекта 10: ${roadmaps.length}`);
    
    for (const roadmap of roadmaps) {
      console.log(`   - Дорожная карта ${roadmap.id} (фреймворк: ${roadmap.frameworkId})`);
      console.log(`     Фаз: ${roadmap.phases.length}`);
      
      for (const phase of roadmap.phases) {
        console.log(`     - Фаза ${phase.id} (связана с phaseId: ${phase.phaseId}): ${phase.tasks.length} задач`);
      }
    }
    
    // Проверяем артефакты, на которые ссылаются задачи
    const allArtifactIds = new Set();
    for (const task of tasksForFramework) {
      for (const artifactId of task.artifactIds || []) {
        allArtifactIds.add(artifactId);
      }
    }
    
    console.log(`\n✅ Найдено ${allArtifactIds.size} уникальных ID артефактов в задачах`);
    
    // Проверяем существование этих артефактов в каталоге
    const artifactIdsList = Array.from(allArtifactIds);
    if (artifactIdsList.length > 0) {
      const existingArtifacts = await prisma.artifactCatalog.findMany({
        where: {
          id: {
            in: artifactIdsList
          }
        }
      });
      
      console.log(`   - Артефактов найдено в каталоге: ${existingArtifacts.length} из ${artifactIdsList.length}`);
      
      const missingArtifactIds = artifactIdsList.filter(id => !existingArtifacts.some(a => a.id === id));
      if (missingArtifactIds.length > 0) {
        console.log(`   - ❌ Отсутствующие артефакты: ${missingArtifactIds.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Ошибка при отладке дорожной карты:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRoadmap().catch(console.error);