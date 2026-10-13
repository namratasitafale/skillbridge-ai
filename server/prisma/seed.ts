import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.upsert({
    where: { id: 'devflow-demo-project' },
    update: {},
    create: {
      id: 'devflow-demo-project',
      name: 'DevFlow Demo Workspace',
      description: 'Clearly identified sample project records for demonstrating DevFlow.'
    }
  });

  const issues = [
    {
      id: 'devflow-demo-issue-api',
      title: 'Document issue API responses',
      description: 'Sample task for the DevFlow demonstration workspace.',
      type: 'TASK',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      assignee: 'Demo User'
    },
    {
      id: 'devflow-demo-issue-board',
      title: 'Review sprint board workflow',
      description: 'Sample feature record for the DevFlow demonstration workspace.',
      type: 'FEATURE',
      status: 'TODO',
      priority: 'LOW',
      assignee: null
    },
    {
      id: 'devflow-demo-issue-validation',
      title: 'Validate due date input',
      description: 'Sample bug report for the DevFlow demonstration workspace.',
      type: 'BUG',
      status: 'IN_REVIEW',
      priority: 'HIGH',
      assignee: 'Demo User'
    }
  ];

  for (const issue of issues) {
    await prisma.issue.upsert({
      where: { id: issue.id },
      update: {},
      create: { ...issue, projectId: project.id }
    });
  }

  console.log(`Seeded ${issues.length} clearly labeled DevFlow sample issues.`);
}

main()
  .catch((error: unknown) => {
    console.error('DevFlow seed failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());