import { z } from 'zod';

const nonEmptyId = z.string().trim().min(1).max(64);
const optionalDescription = z.string().trim().max(4000).nullable().optional();
const dateValue = z.string().refine((value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return value.includes('T') || parsed.toISOString().slice(0, 10) === value;
}, 'Expected a valid ISO date or datetime');

export const idParamsSchema = z.object({
  projectId: nonEmptyId.optional(),
  issueId: nonEmptyId.optional()
});

export const projectIdParamsSchema = z.object({ projectId: nonEmptyId });
export const issueIdParamsSchema = z.object({ issueId: nonEmptyId });
export const issueListQuerySchema = z.object({
  projectId: nonEmptyId.optional()
});

export const projectCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: optionalDescription
});

export const projectUpdateSchema = projectCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided'
);

export const issueTypeSchema = z.enum(['TASK', 'BUG', 'FEATURE']);
export const issueStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);
export const issuePrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const issueCreateSchema = z.object({
  projectId: nonEmptyId,
  title: z.string().trim().min(3).max(180),
  description: optionalDescription,
  type: issueTypeSchema,
  status: issueStatusSchema.optional(),
  priority: issuePrioritySchema.optional(),
  assignee: z.string().trim().max(120).nullable().optional(),
  dueDate: dateValue.nullable().optional()
}).transform((data) => ({
  ...data,
  dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate
}));

export const issueUpdateSchema = z.object({
  title: z.string().trim().min(3).max(180).optional(),
  description: optionalDescription,
  type: issueTypeSchema.optional(),
  status: issueStatusSchema.optional(),
  priority: issuePrioritySchema.optional(),
  assignee: z.string().trim().max(120).nullable().optional(),
  dueDate: dateValue.nullable().optional()
}).partial().refine((data) => Object.keys(data).length > 0, 'At least one field must be provided')
  .transform((data) => ({
    ...data,
    dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate
  }));

export const commentCreateSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  author: z.string().trim().min(1).max(120).optional()
});