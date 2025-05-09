const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProjectRoadmap() {
  try {
    const project = await prisma.project.findUnique({
      where: { id: 10 }
    });
    
    console.log('Project:', {
      id: project.id,
      title: project.title,
      frameworkId: project.frameworkId
    });
    
    // Check roadmaps
    const roadmaps = await prisma.projectRoadmap.findMany({
      where: { projectId: 10 }
    });
    
    console.log(`Found ${roadmaps.length} roadmaps for project 10`);
    
    if (roadmaps.length > 0) {
      for (const roadmap of roadmaps) {
        console.log(`\nRoadmap: ${roadmap.id}, Framework: ${roadmap.frameworkId}`);
        
        // Check phases
        const phases = await prisma.projectPhase.findMany({
          where: { projectRoadmapId: roadmap.id }
        });
        
        console.log(`Found ${phases.length} phases for roadmap ${roadmap.id}`);
        
        // Check tasks for each phase
        for (const phase of phases) {
          const tasks = await prisma.projectTask.findMany({
            where: { projectPhaseId: phase.id }
          });
          
          console.log(`Phase ${phase.id} (${phase.name || phase.phaseId}): ${tasks.length} tasks`);
        }
      }
    } else {
      console.log('No roadmaps found for project 10');
    }
    
    // Check if there are any other active roadmaps
    const allRoadmaps = await prisma.projectRoadmap.findMany({
      where: { isActive: true }
    });
    
    console.log(`\nTotal active roadmaps in system: ${allRoadmaps.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjectRoadmap();