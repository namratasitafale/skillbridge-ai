import type { Request, Response } from 'express';
import * as issueService from '../services/issue-service.js';
import {
  commentCreateSchema,
  issueCreateSchema,
  issueIdParamsSchema,
  issueListQuerySchema,
  issueUpdateSchema
} from '../validators/schemas.js';

export async function listIssues(request: Request, response: Response) {
  const { projectId } = issueListQuerySchema.parse(request.query);
  response.json({ data: await issueService.listIssues(projectId) });
}

export async function getIssue(request: Request, response: Response) {
  const { issueId } = issueIdParamsSchema.parse(request.params);
  response.json({ data: await issueService.getIssue(issueId) });
}

export async function createIssue(request: Request, response: Response) {
  const input = issueCreateSchema.parse(request.body);
  const issue = await issueService.createIssue(input);
  response.status(201).json({ data: issue });
}

export async function updateIssue(request: Request, response: Response) {
  const { issueId } = issueIdParamsSchema.parse(request.params);
  const input = issueUpdateSchema.parse(request.body);
  response.json({ data: await issueService.updateIssue(issueId, input) });
}

export async function deleteIssue(request: Request, response: Response) {
  const { issueId } = issueIdParamsSchema.parse(request.params);
  await issueService.deleteIssue(issueId);
  response.status(204).send();
}

export async function listComments(request: Request, response: Response) {
  const { issueId } = issueIdParamsSchema.parse(request.params);
  response.json({ data: await issueService.listComments(issueId) });
}

export async function createComment(request: Request, response: Response) {
  const { issueId } = issueIdParamsSchema.parse(request.params);
  const { body, author } = commentCreateSchema.parse(request.body);
  response.status(201).json({ data: await issueService.addComment(issueId, body, author) });
}

export async function listActivity(request: Request, response: Response) {
  const { issueId } = issueIdParamsSchema.parse(request.params);
  response.json({ data: await issueService.listActivity(issueId) });
}