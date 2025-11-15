const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      password: hashedPassword,
      name: 'John Doe'
    }
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      password: hashedPassword,
      name: 'Jane Smith'
    }
  });

  console.log('✅ Created users:', { user1: user1.name, user2: user2.name });

  // Create sample projects
  const project1 = await prisma.project.upsert({
    where: { id: 'project-1' },
    update: {},
    create: {
      id: 'project-1',
      name: 'My Portfolio',
      description: 'A showcase of my web development projects',
      ownerId: user1.id
    }
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'project-2' },
    update: {},
    create: {
      id: 'project-2',
      name: 'Design Portfolio',
      description: 'Creative design projects and case studies',
      ownerId: user2.id
    }
  });

  console.log('✅ Created projects:', { project1: project1.name, project2: project2.name });

  // Add user2 as member to project1
  await prisma.projectAccess.upsert({
    where: {
      userId_projectId: {
        userId: user2.id,
        projectId: project1.id
      }
    },
    update: {},
    create: {
      userId: user2.id,
      projectId: project1.id,
      role: 'EDITOR'
    }
  });

  console.log('✅ Added project members');

  // Create sample content blocks
  const content1 = await prisma.content.upsert({
    where: { id: 'content-1' },
    update: {},
    create: {
      id: 'content-1',
      projectId: project1.id,
      type: 'TEXT',
      data: {
        text: 'Welcome to my portfolio! I am a passionate web developer with expertise in modern technologies.',
        title: 'About Me'
      },
      order: 0
    }
  });

  const content2 = await prisma.content.upsert({
    where: { id: 'content-2' },
    update: {},
    create: {
      id: 'content-2',
      projectId: project1.id,
      type: 'IMAGE',
      data: {
        url: 'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Portfolio+Image',
        caption: 'My latest project showcase'
      },
      order: 1
    }
  });

  const content3 = await prisma.content.upsert({
    where: { id: 'content-3' },
    update: {},
    create: {
      id: 'content-3',
      projectId: project1.id,
      type: 'CODE',
      data: {
        language: 'javascript',
        code: 'function greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));',
        title: 'Sample JavaScript Function'
      },
      order: 2
    }
  });

  console.log('✅ Created content blocks');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📋 Sample Data Summary:');
  console.log(`- Users: ${user1.name}, ${user2.name}`);
  console.log(`- Projects: ${project1.name}, ${project2.name}`);
  console.log(`- Content blocks: ${content1.type}, ${content2.type}, ${content3.type}`);
  console.log(`- AI analysis: 1 analysis for image content`);
  console.log('\n🔑 Login credentials:');
  console.log('Email: john@example.com, Password: password123');
  console.log('Email: jane@example.com, Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
