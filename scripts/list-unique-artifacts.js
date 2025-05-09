const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUniqueArtifacts() {
  try {
    // Get all framework tasks
    const tasks = await prisma.frameworkTask.findMany();
    
    // Extract all artifact IDs
    const artifactIds = new Set();
    
    tasks.forEach(task => {
      if (task.artifactIds && task.artifactIds.length > 0) {
        task.artifactIds.forEach(id => artifactIds.add(id));
      }
    });
    
    console.log(`Found ${artifactIds.size} unique artifact IDs:`);
    
    // Convert to array and sort
    const sortedArtifactIds = Array.from(artifactIds).sort();
    
    // Check which artifact IDs exist in the catalog
    for (const artifactId of sortedArtifactIds) {
      const exists = await prisma.artifactCatalog.findUnique({
        where: { id: artifactId }
      });
      
      console.log(`${exists ? '✅' : '❌'} ${artifactId}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUniqueArtifacts();