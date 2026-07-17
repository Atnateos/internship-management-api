import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@infnova.com';
  const rawPassword = 'SecurePassword123';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  // Insert or update administrator credentials
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'System Admin',
      password: hashedPassword,
    },
  });

  // Seed a sample applicant profile for testing
  await prisma.applicant.upsert({
    where: { email: 'jane.doe@example.com' },
    update: {},
    create: {
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '+14155552671',
      track: 'Backend Development',
      status: 'Pending',
      notes: 'Strong database knowledge and NestJS candidate.',
    },
  });

  console.log('Database seeding process completed.');
  console.log(`Admin credentials: Email: ${adminEmail} | Password: ${rawPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });