const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Please provide an email address as an argument');
    process.exit(1);
  }

  try {
    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'ADMIN',
        permissions: [
          'CREATE_PLANT',
          'EDIT_PLANT',
          'DELETE_PLANT',
          'CREATE_LOG',
          'EDIT_LOG',
          'DELETE_LOG',
          'MANAGE_USERS',
          'MANAGE_ROLES',
          'MANAGE_STRAINS'
        ],
      },
      create: {
        email,
        role: 'ADMIN',
        permissions: [
          'CREATE_PLANT',
          'EDIT_PLANT',
          'DELETE_PLANT',
          'CREATE_LOG',
          'EDIT_LOG',
          'DELETE_LOG',
          'MANAGE_USERS',
          'MANAGE_ROLES',
          'MANAGE_STRAINS'
        ],
      },
    });

    console.log('Admin user created/updated:', admin);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 