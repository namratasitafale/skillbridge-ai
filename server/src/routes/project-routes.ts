import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import * as projectController from '../controllers/project-controller.js';

export const projectRouter = Router();

projectRouter.get('/', asyncHandler(projectController.listProjects));
projectRouter.post('/', asyncHandler(projectController.createProject));
projectRouter.get('/:projectId', asyncHandler(projectController.getProject));
projectRouter.patch('/:projectId', asyncHandler(projectController.updateProject));
projectRouter.delete('/:projectId', asyncHandler(projectController.deleteProject));