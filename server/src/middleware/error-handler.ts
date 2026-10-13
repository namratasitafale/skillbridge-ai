import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { HttpError } from './http-error.js';

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: 'Validation failed',
      details: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      response.status(409).json({ error: 'A record with those values already exists.' });
      return;
    }

    if (error.code === 'P2003') {
      response.status(400).json({ error: 'A referenced record does not exist.' });
      return;
    }

    if (error.code === 'P2025') {
      response.status(404).json({ error: 'The requested record was not found.' });
      return;
    }
  }

  const parserError = error as { status?: number; type?: string };
  if (parserError?.type === 'entity.parse.failed') {
    response.status(400).json({ error: 'Request body must contain valid JSON.' });
    return;
  }

  if (parserError?.type === 'entity.too.large') {
    response.status(413).json({ error: 'Request body is too large.' });
    return;
  }

  console.error('Unhandled API error:', error);
  response.status(500).json({ error: 'An unexpected server error occurred.' });
};