-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'MEMBER', 'GUEST');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'CLOSED', 'DELETED');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('UPLOADED', 'PARSED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "ArtifactStage" AS ENUM ('INITIATION_DISCOVERY', 'ANALYSIS_MODELING', 'SOLUTION_DESIGN_PLANNING', 'MONITORING_EVALUATION');

-- CreateEnum
CREATE TYPE "ArtifactStatus" AS ENUM ('NOT_STARTED', 'DRAFT', 'IN_REVIEW', 'APPROVED', 'OBSOLETE');

-- CreateEnum
CREATE TYPE "ArtifactFormat" AS ENUM ('DOCX', 'XLSX', 'PDF', 'BPMN', 'PNG', 'OTHER');

-- CreateEnum
CREATE TYPE "PhaseStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiSettings" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,
    "summary" TEXT,
    "businessNeed" TEXT,
    "businessOwner" TEXT,
    "constraints" TEXT,
    "coreTeamSize" TEXT,
    "deliverables" TEXT,
    "durationBucket" TEXT,
    "framework" TEXT,
    "initialArtifacts" TEXT,
    "notes" TEXT,
    "outOfScope" TEXT,
    "preferredStyle" TEXT,
    "processMaturity" TEXT,
    "riskTolerance" TEXT,
    "roadmap" JSONB,
    "scopeAreas" TEXT,
    "sponsor" TEXT,
    "storageLinks" TEXT,
    "storageRules" TEXT,
    "successMetrics" TEXT,
    "targetDate" TIMESTAMP(3),
    "frameworkId" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "gcsPath" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "status" "FileStatus" NOT NULL DEFAULT 'UPLOADED',
    "text" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "artifactId" TEXT,
    "artifactStage" "ArtifactStage",
    "isArtifact" BOOLEAN DEFAULT false,
    "metadata" JSONB,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlossaryTerm" (
    "id" SERIAL NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlossaryTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProcess" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProcess_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "ProjectArtifact" (
    "id" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "artifactId" TEXT NOT NULL,
    "fileId" INTEGER,
    "status" "ArtifactStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "assignedToUserId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stage" "ArtifactStage" NOT NULL,
    "format" "ArtifactFormat" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtifactCatalog" (
    "id" TEXT NOT NULL,
    "enName" TEXT NOT NULL,
    "ruName" TEXT NOT NULL,
    "babokArea" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "minInputs" TEXT,
    "format" TEXT NOT NULL,
    "doneCriteria" TEXT NOT NULL,
    "keywords" TEXT[],
    "dependsOn" TEXT,
    "providesFor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtifactCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProjectUsers" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GlossaryTerm_term_key" ON "GlossaryTerm"("term");

-- CreateIndex
CREATE INDEX "ProjectPhase_projectRoadmapId_idx" ON "ProjectPhase"("projectRoadmapId");

-- CreateIndex
CREATE INDEX "ProjectTask_projectPhaseId_idx" ON "ProjectTask"("projectPhaseId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTaskArtifact_projectTaskId_projectArtifactId_key" ON "ProjectTaskArtifact"("projectTaskId", "projectArtifactId");

-- CreateIndex
CREATE INDEX "ProjectArtifact_projectId_idx" ON "ProjectArtifact"("projectId");

-- CreateIndex
CREATE INDEX "ProjectArtifact_artifactId_idx" ON "ProjectArtifact"("artifactId");

-- CreateIndex
CREATE INDEX "ProjectArtifact_fileId_idx" ON "ProjectArtifact"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtifactCatalog_id_key" ON "ArtifactCatalog"("id");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectUsers_AB_unique" ON "_ProjectUsers"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectUsers_B_index" ON "_ProjectUsers"("B");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProcess" ADD CONSTRAINT "BusinessProcess_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BusinessProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkTask" ADD CONSTRAINT "FrameworkTask_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRoadmap" ADD CONSTRAINT "ProjectRoadmap_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRoadmap" ADD CONSTRAINT "ProjectRoadmap_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPhase" ADD CONSTRAINT "ProjectPhase_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPhase" ADD CONSTRAINT "ProjectPhase_projectRoadmapId_fkey" FOREIGN KEY ("projectRoadmapId") REFERENCES "ProjectRoadmap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_frameworkTaskId_fkey" FOREIGN KEY ("frameworkTaskId") REFERENCES "FrameworkTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_projectPhaseId_fkey" FOREIGN KEY ("projectPhaseId") REFERENCES "ProjectPhase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTaskArtifact" ADD CONSTRAINT "ProjectTaskArtifact_projectArtifactId_fkey" FOREIGN KEY ("projectArtifactId") REFERENCES "ProjectArtifact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTaskArtifact" ADD CONSTRAINT "ProjectTaskArtifact_projectTaskId_fkey" FOREIGN KEY ("projectTaskId") REFERENCES "ProjectTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectArtifact" ADD CONSTRAINT "ProjectArtifact_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "ArtifactCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectArtifact" ADD CONSTRAINT "ProjectArtifact_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectArtifact" ADD CONSTRAINT "ProjectArtifact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectUsers" ADD CONSTRAINT "_ProjectUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectUsers" ADD CONSTRAINT "_ProjectUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;