# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BA Assist is an intelligent business analyst assistant that helps organize work with projects, documents, and tasks. It's a Next.js application with a PostgreSQL database managed through Prisma ORM, and uses Google Cloud Storage for file handling.

## Environment Setup

The project requires:
1. PostgreSQL database
2. Google Cloud Storage for file storage
3. A parser service (which appears to be a separate component but is mentioned in configuration)

## Commands

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### Database Commands

```bash
# Run database migrations
npm run db:migrate

# Deploy database migrations in production
npm run db:deploy

# Seed the database with initial data
npm run db:seed

# Reset database (caution: this drops all data)
npm run db:reset

# Launch Prisma Studio to view/edit database
npm run db:studio
```

### Verification and Setup

```bash
# Verify setup and prerequisites
npm run verify

# Check parser service health
node scripts/check-parser.js

# Test GCS connection
node scripts/test-gcs.js

# Initialize business processes
node scripts/init-business-processes.js
```

## Architecture

### Frontend
- Next.js with React and TypeScript
- Tailwind CSS for styling
- Pages defined in `app/` directory (App Router)

### Backend
- Next.js API routes in `app/api/`
- Authentication with JWT
- Data storage in PostgreSQL
- File storage in Google Cloud Storage

### Key Components
1. **Authentication System**: User registration, login, password management
2. **Project Management**: Creating and managing projects
3. **File Handling**: Upload, process, and analyze documents
4. **Task Management**: Kanban-style task board
5. **Chat**: Project-level communication
6. **Knowledge Base**: Glossary and business process hierarchy

## Important Dependencies

- **Database**: Prisma ORM with PostgreSQL
- **File Storage**: Google Cloud Storage
- **Authentication**: JWT, bcrypt
- **Email**: Nodemailer
- **Validation**: Zod
- **UI Components**: react-beautiful-dnd for drag-drop functionality

## Parser Service Integration

The application expects a separate parser service running on port 4000 for document text extraction. If the parser service is not running, document processing functionality will not work.

When testing document processing, verify that:
1. The parser service is running
2. The `PARSER_URL` in the `.env` file is correctly set to `http://localhost:4000/extract-text`

## Troubleshooting

When encountering issues:
1. Check database connection in `.env`
2. Verify GCS bucket and credentials
3. Ensure parser service is running
4. Visit diagnostic page at `/dashboard/troubleshoot`
5. Run verification scripts in the `scripts/` directory

## Environmental Variables

Key environment variables needed in `.env`:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT tokens
- `GCS_PROJECT_ID`: Google Cloud project ID
- `GCS_BUCKET`: GCS bucket name
- `GCS_KEY_FILE`: Path to GCS service account key
- `PARSER_URL`: URL to parser service