import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { issueRouter } from './routes/issue-routes.js';
import { projectRouter } from './routes/project-routes.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';

export const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_request, response) => {
  response.json({ data: { status: 'ok' } });
});

app.use('/api/projects', projectRouter);
app.use('/api/issues', issueRouter);
app.use(notFoundHandler);
app.use(errorHandler);