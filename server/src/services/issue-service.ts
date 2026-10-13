import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../middleware/http-error.js';
import type { z } from 'zod';
import type { issueCreateSchema, issueUpdateSchema } from '../validators/schemas.js';

type CreateIssueInput = z.infer<typeof issueCreateSchema>;
type UpdateIssueInput = z.infer<typeof issueUpdateSchema>;

const issueDetails = {
  project: { select: { id: true, name: true } },
  comments: { orderBy: { createdAt: 'asc' as const } },
  activities: { orderBy: { createdAt: 'desc' as const } }
} satisfies Prisma.IssueInclude;

export function listIssues(projectId?: string) {
  return prisma.issue.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { project: { select: { id: true, name: true } } }
  });
}

export async function getIssue(issueId: string) {
  const issue = await prisma.issue.findUnique({ where: { id: issueId }, include: issueDetails });
  if (!issue) throw new HttpError(404, 'Issue not found.');
  return issue;
}

export async function createIssue(input: CreateIssueInput) {
  const { projectId, ...issueInput } = input;

  return prisma.$transaction(async (transaction) => {
    const project = await transaction.project.findUnique({ where: { id: projectId } });
    if (!project) throw new HttpError(404, 'Project not found.');

    const issue = await transaction.issue.create({
      data: { ...issueInput, projectId },
      include: issueDetails
    });
    await transaction.issueActivity.create({
      data: { issueId: issue.id, action: 'CREATED', details: 'Issue created.' }
    });
    return getIssueWithinTransaction(transaction, issue.id);
  });
}

export async function updateIssue(issueId: string, input: UpdateIssueInput) {
  const previous = await getIssue(issueId);
  return prisma.$transaction(async (transaction) => {
    await transaction.issue.update({ where: { id: issueId }, data: input });
    const statusChanged = input.status !== undefined && input.status !== previous.status;
    const fields = Object.keys(input).join(', ');
    await transaction.issueActivity.create({
      data: {
        issueId,
        action: statusChanged ? 'STATUS_CHANGED' : 'UPDATED',
        details: statusChanged
          ? `Status changed from ${previous.status} to ${input.status}.`
          : `Updated fields: ${fields}.`
      }
    });
    return getIssueWithinTransaction(transaction, issueId);
  });
}

export async function deleteIssue(issueId: string) {
  await getIssue(issueId);
  await prisma.issue.delete({ where: { id: issueId } });
}

export async function listComments(issueId: string) {
  await getIssue(issueId);
  return prisma.issueComment.findMany({ where: { issueId }, orderBy: { createdAt: 'asc' } });
}

export async function addComment(issueId: string, body: string, author?: string) {
  await getIssue(issueId);
  return prisma.$transaction(async (transaction) => {
    const comment = await transaction.issueComment.create({ data: { issueId, body, author } });
    await transaction.issueActivity.create({
      data: { issueId, action: 'COMMENTED', details: 'A comment was added.', actor: author }
    });
    return comment;
  });
}

export async function listActivity(issueId: string) {
  await getIssue(issueId);
  return prisma.issueActivity.findMany({ where: { issueId }, orderBy: { createdAt: 'desc' } });
}

function getIssueWithinTransaction(transaction: Prisma.TransactionClient, issueId: string) {
  return transaction.issue.findUniqueOrThrow({ where: { id: issueId }, include: issueDetails });
}