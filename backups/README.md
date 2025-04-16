# Database Backups

This directory contains PostgreSQL database backups for the Garden Logbook application.

## Latest Backup

The latest backup is stored in `db_backup.sql`. This backup includes all tables, data, and schema information.

## Restoring the Backup

To restore the backup, follow these steps:

1. Make sure PostgreSQL is running
2. Create a new database (if it doesn't exist):
   ```bash
   createdb garden_logbook
   ```

3. Restore the backup:
   ```bash
   psql garden_logbook < db_backup.sql
   ```

   Or with specific credentials:
   ```bash
   PGPASSWORD=your_password psql -h localhost -U your_user garden_logbook < db_backup.sql
   ```

## Creating a New Backup

To create a new backup:

```bash
PGPASSWORD=your_password pg_dump -h localhost -U your_user garden_logbook > db_backup.sql
```

Replace `your_password` and `your_user` with your database credentials.

## Backup Schedule

It's recommended to create backups:
- Before major database schema changes
- After significant data additions
- Before deploying to production
- Regularly (daily/weekly) in production environment 