import { Router, Request, Response } from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController';
import {
  validateCreateProject,
  validateUpdateProject,
  validateProjectId,
} from '../middleware/validate';

const router = Router();

// GET /api/projects
router.get('/', getProjects);

// GET /api/projects/:id
router.get('/:id', validateProjectId, getProject);

// POST /api/projects
router.post('/', validateCreateProject, createProject);

// PUT /api/projects/:id
router.put('/:id', validateUpdateProject, updateProject);

// DELETE /api/projects/:id
router.delete('/:id', validateProjectId, deleteProject);

export default router;
