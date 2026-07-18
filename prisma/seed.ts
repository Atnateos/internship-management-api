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

  // Seed sample applicants spanning every status and every internship track,
  // so the dashboard summary and filters have something meaningful to show.
  const sampleApplicants = [
    {
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '+14155552671',
      track: 'Backend Development',
      status: 'Pending',
      notes: 'Strong database knowledge and NestJS candidate.',
    },
    {
      name: 'Abebe Kebede',
      email: 'abebe.kebede@example.com',
      phone: '+251911000001',
      track: 'Frontend Development',
      status: 'Shortlisted',
      notes: 'Solid React portfolio, invited for technical interview.',
    },
    {
      name: 'Sara Tesfaye',
      email: 'sara.tesfaye@example.com',
      phone: '+251911000002',
      track: 'Mobile Development',
      status: 'Pending',
      notes: null,
    },
    {
      name: 'Michael Alemu',
      email: 'michael.alemu@example.com',
      phone: '+251911000003',
      track: 'UI/UX Design',
      status: 'Accepted',
      notes: 'Excellent Figma case study, offer sent.',
    },
    {
      name: 'Hana Girma',
      email: 'hana.girma@example.com',
      phone: '+251911000004',
      track: 'Data Analytics',
      status: 'Rejected',
      notes: 'Did not meet the SQL requirement for this cohort.',
    },
    {
      name: 'Dawit Mulugeta',
      email: 'dawit.mulugeta@example.com',
      phone: '+251911000005',
      track: 'Backend Development',
      status: 'Shortlisted',
      notes: 'Good grasp of REST and relational databases.',
    },
    {
      name: 'Liya Solomon',
      email: 'liya.solomon@example.com',
      phone: '+251911000006',
      track: 'Frontend Development',
      status: 'Pending',
      notes: null,
    },
    {
      name: 'Yonas Bekele',
      email: 'yonas.bekele@example.com',
      phone: '+251911000007',
      track: 'Data Analytics',
      status: 'Pending',
      notes: 'Has a strong statistics background.',
    },
  ];

  for (const applicant of sampleApplicants) {
    await prisma.applicant.upsert({
      where: { email: applicant.email },
      update: {},
      create: applicant,
    });
  }

  console.log('Database seeding process completed.');
  console.log(`Seeded ${sampleApplicants.length} sample applicants.`);
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