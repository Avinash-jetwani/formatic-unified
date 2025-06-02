const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetUserPasswords() {
  console.log('🔄 Starting password reset process...\n');

  const usersToReset = [
    {
      email: 'admin@formatic.com',
      newPassword: 'NewAdmin2024!',
      name: 'Admin User'
    },
    {
      email: 'john@doe.com', 
      newPassword: 'JohnDoe2024!',
      name: 'John Doe'
    }
  ];

  for (const userData of usersToReset) {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (!existingUser) {
        console.log(`❌ User ${userData.email} not found. Creating new user...`);
        
        // Create new user if doesn't exist
        const hashedPassword = await bcrypt.hash(userData.newPassword, 10);
        const newUser = await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: userData.email === 'admin@formatic.com' ? 'SUPER_ADMIN' : 'CLIENT',
            status: 'ACTIVE'
          }
        });
        
        console.log(`✅ Created new user: ${userData.email} with password: ${userData.newPassword}`);
        console.log(`   User ID: ${newUser.id}, Role: ${newUser.role}\n`);
      } else {
        console.log(`👤 Found existing user: ${userData.email}`);
        
        // Reset password for existing user
        const hashedPassword = await bcrypt.hash(userData.newPassword, 10);
        await prisma.user.update({
          where: { email: userData.email },
          data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpires: null,
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Password reset successful for: ${userData.email}`);
        console.log(`   New password: ${userData.newPassword}`);
        console.log(`   User ID: ${existingUser.id}, Role: ${existingUser.role}\n`);
      }
    } catch (error) {
      console.error(`❌ Error processing user ${userData.email}:`, error.message);
    }
  }

  console.log('🎉 Password reset process completed!');
  console.log('\n📋 LOGIN CREDENTIALS:');
  console.log('=====================================');
  usersToReset.forEach(user => {
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.newPassword}`);
    console.log('-------------------------------------');
  });
}

// Run the script
resetUserPasswords()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  }); 