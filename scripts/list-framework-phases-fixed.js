const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listFrameworkPhases() {
  try {
    const frameworks = await prisma.framework.findMany();
    
    for (const framework of frameworks) {
      console.log(`\nFramework: ${framework.id} - ${framework.name}`);
      
      const phases = await prisma.phase.findMany({
        where: { frameworkId: framework.id }
      });
      
      if (phases.length === 0) {
        console.log('  No phases found');
      } else {
        console.log('  Phases:');
        for (const phase of phases) {
          console.log(`    - ${phase.id}: ${phase.name} (${phase.ruName})`);
          
          // Check for tasks in each phase
          const taskCount = await prisma.frameworkTask.count({
            where: {
              frameworkId: framework.id,
              phaseId: phase.id
            }
          });
          
          console.log(`      Tasks: ${taskCount}`);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listFrameworkPhases();