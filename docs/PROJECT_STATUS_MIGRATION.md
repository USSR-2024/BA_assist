# Project Status Migration

This document describes the migration path for adding new project statuses to the system.

## Current Workaround

Due to migration issues, we've implemented a temporary workaround:

1. The database schema has been updated in `prisma/schema.prisma` to include new `CLOSED` and `DELETED` statuses
2. The UI has been updated to show both new and old statuses correctly
3. Currently, `ARCHIVED` status is being used in place of both `CLOSED` and `DELETED` statuses
4. The UI displays `ARCHIVED` projects as "Закрытый" (Closed)

## To Complete the Migration

When the database schema can be properly updated, follow these steps:

1. Apply the migration to add new enum values:
   ```bash
   # Method 1: Run the SQL migration directly
   psql -d your_database_name -f prisma/manual-migration.sql
   
   # Method 2: Try running the Prisma migration
   npx prisma migrate dev --name add_project_statuses
   ```

2. Regenerate the Prisma client after migration:
   ```bash
   npx prisma generate
   ```

3. Update the API endpoint `/api/projects/[id]/manage/route.ts`:
   ```typescript
   // Replace this:
   switch(action) {
     case 'close':
       // Use ARCHIVED as a temporary solution until migration is completed
       newStatus = 'ARCHIVED' // Should be CLOSED after migration
       message = 'Проект успешно закрыт'
       break
     case 'delete':
       // Use ARCHIVED as a temporary solution until migration is completed
       newStatus = 'ARCHIVED' // Should be DELETED after migration
       break
     case 'reopen':
       newStatus = 'ACTIVE'
       message = 'Проект успешно переоткрыт'
       break
   }
   
   // With this:
   switch(action) {
     case 'close':
       newStatus = 'CLOSED' 
       message = 'Проект успешно закрыт'
       break
     case 'delete':
       newStatus = 'DELETED'
       message = 'Проект успешно удален (помечен как удаленный)'
       break
     case 'reopen':
       newStatus = 'ACTIVE'
       message = 'Проект успешно переоткрыт'
       break
   }
   ```

4. Update dashboard filters in `/app/dashboard/page.tsx`:
   ```typescript
   // Replace the ARCHIVED button with this:
   <button
     className={`px-3 py-1 rounded-md ${filter === 'CLOSED' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}
     onClick={() => setFilter('CLOSED')}
   >
     Закрытые
   </button>
   <button
     className={`px-3 py-1 rounded-md ${filter === 'ARCHIVED' ? 'bg-gray-600 text-white' : 'bg-gray-200'}`}
     onClick={() => setFilter('ARCHIVED')}
   >
     Архивные
   </button>
   ```

## After Migration

After migration is complete, you may want to update existing projects:

```sql
-- Convert ARCHIVED projects to CLOSED if they were intended to be closed
UPDATE "Project" SET status = 'CLOSED' WHERE status = 'ARCHIVED' AND /* some condition */;
```

You can determine which projects should be converted based on specific criteria or project metadata.