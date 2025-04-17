# Garden Logbook Database Schema Backup

This document contains the database schema and setup instructions for the Garden Logbook application.

## Setup Instructions

1. Install PostgreSQL on your machine
2. Create a new database for the application
3. Copy the `.env.example` file to `.env` and update the database connection string
4. Run the setup script:
   ```bash
   chmod +x scripts/db-setup.sh
   ./scripts/db-setup.sh
   ```

## Environment Variables

Required environment variables in `.env`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/garden_logbook"
```

## Schema Structure

The application uses the following main models:

1. **User Management**
   - User
   - Account (for OAuth)
   - Session
   - VerificationToken

2. **Garden Organization**
   - Garden
   - Room
   - Zone
   - Plant

3. **Logging System**
   - Log
   - LogTemplate
   - LogEntry
   - Tag

4. **Equipment & Maintenance**
   - Equipment
   - CleaningSOP
   - MaintenanceTask

## Schema Backup

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// [Rest of the schema content...]
```

## Migration Process

When setting up on a new machine:

1. Ensure PostgreSQL is installed and running
2. Create a new database
3. Update the `.env` file with the new database connection string
4. Run the migrations:
   ```bash
   npx prisma migrate deploy
   ```

## Backup Process

To backup the schema:
1. Copy the current schema to a dated backup file:
   ```bash
   cp prisma/schema.prisma prisma/schema_backup_$(date +%Y%m%d).prisma
   ```

2. To backup the database data (optional):
   ```bash
   pg_dump -U username -d garden_logbook > backup_$(date +%Y%m%d).sql
   ``` 