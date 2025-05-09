const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyRoadmapCreation() {
  try {
    console.log('Verifying roadmap creation capabilities...');
    
    // Check frameworks
    const frameworks = await prisma.framework.findMany();
    console.log(`\nFound ${frameworks.length} frameworks:`);
    for (const framework of frameworks) {
      console.log(`- ${framework.id}: ${framework.name}`);
      
      // Check phases for each framework
      const phases = await prisma.phase.findMany({
        where: { frameworkId: framework.id }
      });
      
      // Check tasks for each phase
      let totalTasks = 0;
      for (const phase of phases) {
        const tasks = await prisma.frameworkTask.count({
          where: { 
            frameworkId: framework.id,
            phaseId: phase.id
          }
        });
        totalTasks += tasks;
      }
      
      console.log(`  Phases: ${phases.length}, Tasks: ${totalTasks}`);
      
      // Evaluate roadmap readiness
      const readiness = totalTasks > 0 ? '✅ Ready for roadmap creation' : '❌ Missing tasks, roadmap may be incomplete';
      console.log(`  ${readiness}`);
    }
    
    console.log('\nVerification complete!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyRoadmapCreation();