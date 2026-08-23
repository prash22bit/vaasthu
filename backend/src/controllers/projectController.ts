import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { projectService } from '../services/projectService';
import { AppError } from '../middleware/errorHandler';
import { FACING_DEGREES } from '@vastuplan/shared';
import type { CreateProjectPayload, FacingDirection } from '@vastuplan/shared';

/**
 * GET /api/projects
 */
export async function getProjects(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projects = await projectService.findAll();
    res.json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:id
 */
export async function getProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const project = await projectService.findById(req.params.id);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/projects
 */
export async function createProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400, errors.array()));
    }

    const { name, plot, floors, settings } = req.body;

    // Derive orientationDegrees from facing
    const facing = plot.facing as FacingDirection;
    const orientationDegrees = FACING_DEGREES[facing] ?? 0;

    const payload: CreateProjectPayload = {
      name,
      plot: { ...plot, orientationDegrees },
      floors: floors ?? [
        {
          id: `floor_${Date.now()}`,
          name: 'Ground Floor',
          level: 0,
          entities: [],
          floorHeight: 10,
        },
      ],
      settings: settings ?? {
        grid: { visible: true, cellSize: 1, snapToGrid: false },
        defaultUnit: plot.unit,
        showDimensions: true,
        showCompass: true,
      },
    };

    const project = await projectService.create(payload);
    res.status(201).json({ success: true, data: project, message: 'Project created successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/projects/:id
 */
export async function updateProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400, errors.array()));
    }

    const { name, plot, floors, settings } = req.body;
    const updatePayload: Record<string, unknown> = {};

    if (name !== undefined) updatePayload.name = name;
    if (plot !== undefined) {
      const facing = plot.facing as FacingDirection;
      updatePayload.plot = {
        ...plot,
        orientationDegrees: FACING_DEGREES[facing] ?? plot.orientationDegrees ?? 0,
      };
    }
    if (floors !== undefined) updatePayload.floors = floors;
    if (settings !== undefined) updatePayload.settings = settings;

    const project = await projectService.update(req.params.id, updatePayload);
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    res.json({ success: true, data: project, message: 'Project updated successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/projects/:id
 */
export async function deleteProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const deleted = await projectService.delete(req.params.id);
    if (!deleted) {
      return next(new AppError('Project not found', 404));
    }
    res.json({ success: true, data: null, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
}
