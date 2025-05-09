const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function importFrameworkTasks() {
  try {
    console.log('Starting import of framework tasks...');
    
    // Import PMBOK-Lite tasks
    const pmbokTasksPath = path.join(__dirname, '..', 'pmbok-tasks.json');
    if (fs.existsSync(pmbokTasksPath)) {
      const pmbokTasksData = JSON.parse(fs.readFileSync(pmbokTasksPath, 'utf8'));
      console.log(`Importing ${pmbokTasksData.tasks.length} PMBOK-Lite tasks...`);
      await importTasksForFramework(pmbokTasksData.tasks);
    } else {
      console.log('PMBOK-Lite tasks file not found');
    }
    
    // Import Scrum-BA tasks
    const scrumTasksPath = path.join(__dirname, '..', 'scrum-ba-tasks.json');
    if (fs.existsSync(scrumTasksPath)) {
      const scrumTasksData = JSON.parse(fs.readFileSync(scrumTasksPath, 'utf8'));
      console.log(`Importing ${scrumTasksData.tasks.length} Scrum-BA tasks...`);
      await importTasksForFramework(scrumTasksData.tasks);
    } else {
      console.log('Scrum-BA tasks file not found');
    }
    
    // Import Lean/Six Sigma tasks
    const lssTasksPath = path.join(__dirname, '..', 'lean-six-sigma-tasks.json');
    if (fs.existsSync(lssTasksPath)) {
      const lssTasksData = JSON.parse(fs.readFileSync(lssTasksPath, 'utf8'));
      console.log(`Importing ${lssTasksData.tasks.length} Lean/Six Sigma tasks...`);
      await importTasksForFramework(lssTasksData.tasks);
    } else {
      console.log('Lean/Six Sigma tasks file not found');
    }
    
    console.log('Import completed successfully');
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function importTasksForFramework(tasks) {
  let successCount = 0;
  let errorCount = 0;
  
  for (const task of tasks) {
    try {
      // Check if the framework exists
      const framework = await prisma.framework.findUnique({
        where: { id: task.frameworkId }
      });
      
      if (!framework) {
        console.log(`Framework not found: ${task.frameworkId}`);
        errorCount++;
        continue;
      }
      
      // Check if the phase exists
      const phase = await prisma.frameworkPhase.findFirst({
        where: { 
          frameworkId: task.frameworkId,
          id: task.phaseId
        }
      });
      
      if (!phase) {
        console.log(`Phase not found: ${task.phaseId} for framework ${task.frameworkId}`);
        errorCount++;
        continue;
      }
      
      // Create or update the task
      const result = await prisma.frameworkTask.upsert({
        where: { id: task.taskId },
        update: {
          name: task.name,
          ruName: task.ruName,
          description: task.description,
          ruDescription: task.ruDescription,
          estimatedHours: task.estimatedHours,
          priority: task.priority,
          artifactId: task.artifactId,
          frameworkId: task.frameworkId,
          phaseId: task.phaseId
        },
        create: {
          id: task.taskId,
          name: task.name,
          ruName: task.ruName,
          description: task.description,
          ruDescription: task.ruDescription,
          estimatedHours: task.estimatedHours,
          priority: task.priority,
          artifactId: task.artifactId,
          frameworkId: task.frameworkId,
          phaseId: task.phaseId
        }
      });
      
      console.log(`Imported task: ${task.taskId} - ${task.name}`);
      successCount++;
    } catch (error) {
      console.error(`Error importing task ${task.taskId}:`, error);
      errorCount++;
    }
  }
  
  console.log(`Import summary: ${successCount} tasks imported successfully, ${errorCount} errors`);
}

importFrameworkTasks();