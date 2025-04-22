import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Helper function to check if PostgreSQL is running
async function checkPostgresConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to PostgreSQL');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL. Please ensure:');
    console.error('1. PostgreSQL is installed and running');
    console.error('2. The database user and password in .env are correct');
    console.error('3. The database exists and is accessible');
    console.error('Error details:', error);
    return false;
  }
}

// Helper function to check Node.js version
function checkNodeVersion() {
  const requiredVersion = 18;
  const currentVersion = parseInt(process.version.replace('v', '').split('.')[0]);
  if (currentVersion < requiredVersion) {
    console.error(`❌ Node.js version ${currentVersion} is too old. Please install Node.js ${requiredVersion} or later.`);
    return false;
  }
  console.log(`✅ Node.js version ${process.version} is compatible`);
  return true;
}

async function main() {
  console.log('🚀 Starting project setup...');
  console.log('This script will help you set up the Garden Logbook application.');
  console.log('If you encounter any issues, please check the troubleshooting section in README.md\n');

  // Check Node.js version
  if (!checkNodeVersion()) {
    process.exit(1);
  }

  // Check if .env exists, if not create from .env.example
  if (!fs.existsSync('.env')) {
    console.log('📝 Creating .env file from .env.example...');
    if (fs.existsSync('.env.example')) {
      fs.copyFileSync('.env.example', '.env');
      console.log('✅ .env file created');
      console.log('⚠️ Please edit .env with your database credentials before continuing');
      console.log('Press Enter to continue or Ctrl+C to exit...');
      process.stdin.once('data', () => {
        continueSetup();
      });
      return;
    } else {
      console.error('❌ .env.example not found!');
      process.exit(1);
    }
  }

  continueSetup();
}

async function continueSetup() {
  // Install dependencies
  console.log('\n📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error);
    console.error('Try running: npm install --legacy-peer-deps');
    process.exit(1);
  }

  // Check PostgreSQL connection
  if (!await checkPostgresConnection()) {
    process.exit(1);
  }

  // Generate Prisma client
  console.log('\n🔧 Generating Prisma client...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client:', error);
    process.exit(1);
  }

  // Run migrations
  console.log('\n🔄 Running database migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Failed to run migrations:', error);
    console.error('Try running: npx prisma migrate reset');
    process.exit(1);
  }

  // Seed the database
  console.log('\n🌱 Seeding the database...');
  try {
    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu.Vm', // 'admin123'
      },
    });

    if (!adminUser) {
      throw new Error('Failed to create admin user');
    }

    console.log('✅ Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('⚠️ Please change these credentials after first login!');

    // Add more seed data as needed
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    console.error('Try running: npx prisma migrate reset');
    process.exit(1);
  }

  console.log('\n✨ Setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Access the application at http://localhost:3000');
  console.log('3. Login with the admin credentials shown above');
  console.log('4. Change the admin password immediately after login');
}

main()
  .catch((e) => {
    console.error('❌ Setup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 