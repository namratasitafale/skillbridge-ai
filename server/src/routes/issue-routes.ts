import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import * as issueController from '../controllers/issue-controller.js';

export const issueRouter = Router();

issueRouter.get('/', asyncHandler(issueController.listIssues));
issueRouter.post('/', asyncHandler(issueController.createIssue));
issueRouter.get('/:issueId', asyncHandler(issueController.getIssue));
issueRouter.patch('/:issueId', asyncHandler(issueController.updateIssue));
issueRouter.delete('/:issueId', asyncHandler(issueController.deleteIssue));
issueRouter.get('/:issueId/comments', asyncHandler(issueController.listComments));
issueRouter.post('/:issueId/comments', asyncHandler(issueController.createComment));
issueRouter.get('/:issueId/activity', asyncHandler(issueController.listActivity));