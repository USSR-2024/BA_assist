# Add Project Statuses

This migration adds two new project status values:

1. `CLOSED` - For projects that have been completed and closed
2. `DELETED` - For soft-deleted projects that should not appear in standard queries

## Usage

These new statuses allow project owners to:
- Mark projects as completed (CLOSED)
- Soft-delete projects (DELETED) without permanently removing data

## Implementation Details

The migration simply adds new enum values to the existing `ProjectStatus` enum, which is already being used in the Project model.