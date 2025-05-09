-- CreateEnum
CREATE TYPE "PhaseStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "frameworkId" TEXT;

-- CreateTable
CREATE TABLE "Framework" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "ruName" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "ruDescription" TEXT NOT NULL,
  "methodologyTag" TEXT[],
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isSystem" BOOLEAN NOT NULL DEFAULT true,
  "isCustom" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "suitabilityCriteria" JSONB,

  CONSTRAINT "Framework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phase" (
  "id" TEXT NOT NULL,
  "frameworkId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "ruName" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "description" TEXT,
  "ruDescription" TEXT,
  "durationWeeks" DOUBLE PRECISION NOT NULL,

  CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameworkTask" (
  "id" TEXT NOT NULL,
  "frameworkId" TEXT NOT NULL,
  "phaseId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "ruName" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "ruDescription" TEXT NOT NULL,
  "estimatedHours" INTEGER,
  "acceptanceCriteria" TEXT,
  "isRequired" BOOLEAN NOT NULL DEFAULT true,
  "isSystem" BOOLEAN NOT NULL DEFAULT true,
  "artifactIds" TEXT[],
  "dependsOn" TEXT[],

  CONSTRAINT "FrameworkTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectRoadmap" (
  "id" TEXT NOT NULL,
  "projectId" INTEGER NOT NULL,
  "frameworkId" TEXT NOT NULL,
  "name" TEXT,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdByUserId" TEXT NOT NULL,

  CONSTRAINT "ProjectRoadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectPhase" (
  "id" TEXT NOT NULL,
  "projectRoadmapId" TEXT NOT NULL,
  "phaseId" TEXT NOT NULL,
  "name" TEXT,
  "ruName" TEXT,
  "order" INTEGER NOT NULL,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "status" "PhaseStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "progress" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "ProjectPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTask" (
  "id" TEXT NOT NULL,
  "projectPhaseId" TEXT NOT NULL,
  "frameworkTaskId" TEXT,
  "name" TEXT NOT NULL,
  "ruName" TEXT,
  "description" TEXT,
  "ruDescription" TEXT,
  "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
  "priority" INTEGER NOT NULL DEFAULT 2,
  "estimatedHours" INTEGER,
  "actualHours" INTEGER,
  "startDate" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "assignedToUserId" TEXT,
  "acceptanceCriteria" TEXT,
  "isCustom" BOOLEAN NOT NULL DEFAULT false,
  "dependsOn" TEXT[],
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProjectTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTaskArtifact" (
  "id" TEXT NOT NULL,
  "projectTaskId" TEXT NOT NULL,
  "projectArtifactId" TEXT NOT NULL,
  "status" "ArtifactStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "isRequired" BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "ProjectTaskArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectPhase_projectRoadmapId_idx" ON "ProjectPhase"("projectRoadmapId");

-- CreateIndex
CREATE INDEX "ProjectTask_projectPhaseId_idx" ON "ProjectTask"("projectPhaseId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTaskArtifact_projectTaskId_projectArtifactId_key" ON "ProjectTaskArtifact"("projectTaskId", "projectArtifactId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkTask" ADD CONSTRAINT "FrameworkTask_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRoadmap" ADD CONSTRAINT "ProjectRoadmap_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRoadmap" ADD CONSTRAINT "ProjectRoadmap_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPhase" ADD CONSTRAINT "ProjectPhase_projectRoadmapId_fkey" FOREIGN KEY ("projectRoadmapId") REFERENCES "ProjectRoadmap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPhase" ADD CONSTRAINT "ProjectPhase_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_projectPhaseId_fkey" FOREIGN KEY ("projectPhaseId") REFERENCES "ProjectPhase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_frameworkTaskId_fkey" FOREIGN KEY ("frameworkTaskId") REFERENCES "FrameworkTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTaskArtifact" ADD CONSTRAINT "ProjectTaskArtifact_projectTaskId_fkey" FOREIGN KEY ("projectTaskId") REFERENCES "ProjectTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTaskArtifact" ADD CONSTRAINT "ProjectTaskArtifact_projectArtifactId_fkey" FOREIGN KEY ("projectArtifactId") REFERENCES "ProjectArtifact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;