import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Check if super admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@formatic.com' },
  });

  if (!existingAdmin) {
    // Create super admin
    await prisma.user.create({
      data: {
        email: 'admin@formatic.com',
        password: await bcrypt.hash('Admin123!', 10),
        name: 'Super Admin',
        role: Role.SUPER_ADMIN,
      },
    });
    console.log('Super admin created');
  } else {
    console.log('Super admin already exists');
  }
  
  // Create test client user
  const existingClient = await prisma.user.findUnique({
    where: { email: 'client@example.com' },
  });
  
  if (!existingClient) {
    await prisma.user.create({
      data: {
        email: 'client@example.com',
        password: await bcrypt.hash('Client123!', 10),
        name: 'Test Client',
        role: Role.CLIENT,
      },
    });
    console.log('Test client created');
  } else {
    console.log('Test client already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });