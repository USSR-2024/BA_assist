-- CreateEnum
CREATE TYPE "ArtifactStage" AS ENUM (
  'INITIATION_DISCOVERY',
  'ANALYSIS_MODELING',
  'SOLUTION_DESIGN_PLANNING',
  'MONITORING_EVALUATION'
);

-- CreateEnum
CREATE TYPE "ArtifactStatus" AS ENUM (
  'NOT_STARTED',
  'DRAFT',
  'IN_REVIEW',
  'APPROVED',
  'OBSOLETE'
);

-- CreateEnum
CREATE TYPE "ArtifactFormat" AS ENUM (
  'DOCX',
  'XLSX',
  'PDF',
  'BPMN',
  'PNG',
  'OTHER'
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

-- CreateIndex
CREATE UNIQUE INDEX "ArtifactCatalog_id_key" ON "ArtifactCatalog"("id");

-- CreateIndex
CREATE INDEX "ProjectArtifact_projectId_idx" ON "ProjectArtifact"("projectId");

-- CreateIndex
CREATE INDEX "ProjectArtifact_artifactId_idx" ON "ProjectArtifact"("artifactId");

-- CreateIndex
CREATE INDEX "ProjectArtifact_fileId_idx" ON "ProjectArtifact"("fileId");

-- AddForeignKey
ALTER TABLE "ProjectArtifact" ADD CONSTRAINT "ProjectArtifact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectArtifact" ADD CONSTRAINT "ProjectArtifact_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add Metadata columns to existing File model
ALTER TABLE "File" ADD COLUMN "artifactId" TEXT;
ALTER TABLE "File" ADD COLUMN "artifactStage" "ArtifactStage";
ALTER TABLE "File" ADD COLUMN "isArtifact" BOOLEAN DEFAULT false;
ALTER TABLE "File" ADD COLUMN "metadata" JSONB;

-- Create index on File.artifactId
CREATE INDEX "File_artifactId_idx" ON "File"("artifactId");