const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function importFrameworkTasks() {
  try {
    console.log('Starting import of framework tasks...');
    
    // Import PMBOK-Lite tasks
    const pmbokTasksPath = path.join(__dirname, '..', 'pmbok-tasks-fixed.json');
    if (fs.existsSync(pmbokTasksPath)) {
      const pmbokTasksData = JSON.parse(fs.readFileSync(pmbokTasksPath, 'utf8'));
      console.log(`Importing ${pmbokTasksData.tasks.length} PMBOK-Lite tasks...`);
      await importTasksForFramework(pmbokTasksData.tasks);
    } else {
      console.log('PMBOK-Lite tasks file not found');
    }
    
    // Import Scrum-BA tasks
    const scrumTasksPath = path.join(__dirname, '..', 'scrum-ba-tasks-fixed.json');
    if (fs.existsSync(scrumTasksPath)) {
      const scrumTasksData = JSON.parse(fs.readFileSync(scrumTasksPath, 'utf8'));
      console.log(`Importing ${scrumTasksData.tasks.length} Scrum-BA tasks...`);
      await importTasksForFramework(scrumTasksData.tasks);
    } else {
      console.log('Scrum-BA tasks file not found');
    }
    
    // Import Lean/Six Sigma tasks
    const lssTasksPath = path.join(__dirname, '..', 'lean-six-sigma-tasks-fixed.json');
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
      const phase = await prisma.phase.findFirst({
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
      
      // Update phase IDs in our tasks to match what's in the database
      // We need to adjust task phaseId if our JSON data has phases that don't match the database
      
      // Convert artifactId to an array if it's a string
      const artifactIds = task.artifactId ? [task.artifactId] : [];
      
      // Create or update the task
      const result = await prisma.frameworkTask.upsert({
        where: { id: task.taskId },
        update: {
          frameworkId: task.frameworkId,
          phaseId: task.phaseId,
          name: task.name,
          ruName: task.ruName,
          description: task.description,
          ruDescription: task.ruDescription,
          estimatedHours: task.estimatedHours,
          artifactIds: artifactIds,
          isRequired: true,
          isSystem: true,
          dependsOn: []
        },
        create: {
          id: task.taskId,
          frameworkId: task.frameworkId,
          phaseId: task.phaseId,
          name: task.name,
          ruName: task.ruName,
          description: task.description,
          ruDescription: task.ruDescription,
          estimatedHours: task.estimatedHours,
          artifactIds: artifactIds,
          isRequired: true,
          isSystem: true,
          dependsOn: []
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