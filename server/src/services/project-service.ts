import { prisma } from '../db/prisma.js';
import { HttpError } from '../middleware/http-error.js';
import type { z } from 'zod';
import type { projectCreateSchema, projectUpdateSchema } from '../validators/schemas.js';

type CreateProjectInput = z.infer<typeof projectCreateSchema>;
type UpdateProjectInput = z.infer<typeof projectUpdateSchema>;

export function listProjects() {
  return prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { issues: true } } }
  });
}

export async function getProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { _count: { select: { issues: true } } }
  });
  if (!project) throw new HttpError(404, 'Project not found.');
  return project;
}

export function createProject(input: CreateProjectInput) {
  return prisma.project.create({ data: input });
}

export async function updateProject(projectId: string, input: UpdateProjectInput) {
  await getProject(projectId);
  return prisma.project.update({ where: { id: projectId }, data: input });
}

export async function deleteProject(projectId: string) {
  await getProject(projectId);
  await prisma.project.delete({ where: { id: projectId } });
}