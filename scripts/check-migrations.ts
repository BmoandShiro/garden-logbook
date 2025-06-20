import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function checkMigrationStatus() {
  try {
    console.log('🔍 Checking migration status...');
    const status = execSync('docker compose exec app npx prisma migrate status', { stdio: 'pipe' }).toString();
    
    if (status.includes('Database schema is up to date')) {
      console.log('✅ Database schema is up to date');
      return true;
    } else if (status.includes('Pending migration')) {
      console.error('❌ There are pending migrations that need to be applied');
      console.error('Run: npx prisma migrate dev');
      return false;
    } else {
      console.error('❌ Unknown migration status');
      console.error(status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking migration status:', error);
    return false;
  }
}

function checkMigrationFiles() {
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found');
    return false;
  }

  const migrationFiles = fs.readdirSync(migrationsDir);
  if (migrationFiles.length === 0) {
    console.error('❌ No migration files found');
    return false;
  }

  console.log(`✅ Found ${migrationFiles.length} migration files`);
  return true;
}

function main() {
  console.log('🚀 Checking database migration status...\n');

  const migrationFilesOk = checkMigrationFiles();
  const migrationStatusOk = checkMigrationStatus();

  if (!migrationFilesOk || !migrationStatusOk) {
    console.error('\n❌ Migration check failed. Please fix the issues before committing.');
    process.exit(1);
  }

  console.log('\n✨ All migration checks passed!');
}

main(); 