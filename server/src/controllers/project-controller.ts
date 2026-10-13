import type { Request, Response } from 'express';
import * as projectService from '../services/project-service.js';
import { projectIdParamsSchema, projectCreateSchema, projectUpdateSchema } from '../validators/schemas.js';

export async function listProjects(_request: Request, response: Response) {
  response.json({ data: await projectService.listProjects() });
}

export async function getProject(request: Request, response: Response) {
  const { projectId } = projectIdParamsSchema.parse(request.params);
  response.json({ data: await projectService.getProject(projectId) });
}

export async function createProject(request: Request, response: Response) {
  const input = projectCreateSchema.parse(request.body);
  const project = await projectService.createProject(input);
  response.status(201).json({ data: project });
}

export async function updateProject(request: Request, response: Response) {
  const { projectId } = projectIdParamsSchema.parse(request.params);
  const input = projectUpdateSchema.parse(request.body);
  response.json({ data: await projectService.updateProject(projectId, input) });
}

export async function deleteProject(request: Request, response: Response) {
  const { projectId } = projectIdParamsSchema.parse(request.params);
  await projectService.deleteProject(projectId);
  response.status(204).send();
}