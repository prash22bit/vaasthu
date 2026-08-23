import { ProjectModel } from '../models/Project';
import { Project, CreateProjectPayload, UpdateProjectPayload } from '@vastuplan/shared';

/**
 * Service layer for Project operations.
 * This layer sits between controllers and the database,
 * following the repository pattern so the DB implementation can be swapped later.
 */
export class ProjectService {
  /**
   * Create a new project.
   */
  async create(payload: CreateProjectPayload): Promise<Project> {
    const doc = new ProjectModel(payload);
    const saved = await doc.save();
    // Use toObject() to get a plain object, then toProject handles serialization
    return this.toProject(saved.toObject({ virtuals: true }) as unknown as Record<string, unknown>);
  }

  /**
   * Get all projects, sorted by newest first.
   */
  async findAll(): Promise<Project[]> {
    const docs = await ProjectModel.find().sort({ createdAt: -1 }).lean({ virtuals: true });
    return docs.map((doc) => this.toProject(doc as unknown as Record<string, unknown>));
  }

  /**
   * Find a project by ID.
   */
  async findById(id: string): Promise<Project | null> {
    const doc = await ProjectModel.findById(id).lean({ virtuals: true });
    if (!doc) return null;
    return this.toProject(doc as unknown as Record<string, unknown>);
  }

  /**
   * Update a project by ID.
   * Returns null if not found.
   */
  async update(id: string, payload: UpdateProjectPayload): Promise<Project | null> {
    const doc = await ProjectModel.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    ).lean({ virtuals: true });
    if (!doc) return null;
    return this.toProject(doc as unknown as Record<string, unknown>);
  }

  /**
   * Delete a project by ID.
   * Returns true if deleted, false if not found.
   */
  async delete(id: string): Promise<boolean> {
    const result = await ProjectModel.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Check if a project exists.
   */
  async exists(id: string): Promise<boolean> {
    const count = await ProjectModel.countDocuments({ _id: id });
    return count > 0;
  }

  /**
   * Convert a Mongoose document to a plain Project object.
   */
  private toProject(doc: Record<string, unknown>): Project {
    // If it's a real Mongoose document, serialize it
    const obj: Record<string, unknown> =
      typeof (doc as { toJSON?: () => Record<string, unknown> }).toJSON === 'function'
        ? (doc as { toJSON: () => Record<string, unknown> }).toJSON()
        : doc;

    const id = String(obj.id || obj._id || '');
    return {
      id,
      name: obj.name as string,
      plot: obj.plot as Project['plot'],
      floors: (obj.floors as Project['floors']) || [],
      settings: obj.settings as Project['settings'],
      createdAt: obj.createdAt instanceof Date
        ? (obj.createdAt as Date).toISOString()
        : String(obj.createdAt),
      updatedAt: obj.updatedAt instanceof Date
        ? (obj.updatedAt as Date).toISOString()
        : String(obj.updatedAt),
    };
  }
}

export const projectService = new ProjectService();
