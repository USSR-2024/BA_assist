const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listFrameworks() {
  try {
    const frameworks = await prisma.framework.findMany();
    console.log('Available frameworks:');
    frameworks.forEach(f => {
      console.log(`- ${f.id}: ${f.name}`);
    });
    
    // Also list phases
    for (const framework of frameworks) {
      console.log(`\nPhases for ${framework.name} (${framework.id}):`);
      const phases = await prisma.frameworkPhase.findMany({
        where: { frameworkId: framework.id }
      });
      
      if (phases.length === 0) {
        console.log('  No phases found');
      } else {
        phases.forEach(p => {
          console.log(`  - ${p.id}: ${p.name}`);
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listFrameworks();