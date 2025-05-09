-- Manual migration to add new project statuses
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'CLOSED';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'DELETED';