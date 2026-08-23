import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  Project,
  PlotShape,
  FacingDirection,
  Unit,
} from '@vastuplan/shared';

// ---------------------------------------------------------------------------
// Mongoose document interface
// ---------------------------------------------------------------------------

export interface ProjectDocument extends Omit<Project, 'id'>, Document {
  id: string;
}

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

const WorldPointSchema = new Schema(
  { x: { type: Number, required: true }, y: { type: Number, required: true } },
  { _id: false }
);

const WorldDimensionsSchema = new Schema(
  { width: { type: Number, required: true }, height: { type: Number, required: true } },
  { _id: false }
);

const DesignEntitySchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    position: { type: WorldPointSchema, required: true },
    rotation: { type: Number, default: 0 },
    dimensions: { type: WorldDimensionsSchema, required: true },
    properties: { type: Schema.Types.Mixed, default: {} },
    floorIndex: { type: Number, default: 0 },
    locked: { type: Boolean, default: false },
    visible: { type: Boolean, default: true },
  },
  { _id: false }
);

const FloorSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    level: { type: Number, required: true },
    entities: { type: [DesignEntitySchema], default: [] },
    floorHeight: { type: Number, default: 10 }, // 10 ft default
  },
  { _id: false }
);

const GridSettingsSchema = new Schema(
  {
    visible: { type: Boolean, default: true },
    cellSize: { type: Number, default: 1 },
    snapToGrid: { type: Boolean, default: false },
  },
  { _id: false }
);

const ProjectSettingsSchema = new Schema(
  {
    grid: { type: GridSettingsSchema, default: () => ({}) },
    defaultUnit: { type: String, enum: ['feet', 'meters'] as Unit[], default: 'feet' },
    showDimensions: { type: Boolean, default: true },
    showCompass: { type: Boolean, default: true },
  },
  { _id: false }
);

const PlotSchema = new Schema(
  {
    shape: {
      type: String,
      enum: ['rectangle', 'square', 'l-shaped', 'custom'] as PlotShape[],
      required: true,
    },
    length: { type: Number, required: true, min: 0.1 },
    width: { type: Number, required: true, min: 0.1 },
    unit: { type: String, enum: ['feet', 'meters'] as Unit[], required: true },
    facing: {
      type: String,
      enum: [
        'north', 'south', 'east', 'west',
        'north-east', 'north-west', 'south-east', 'south-west',
      ] as FacingDirection[],
      required: true,
    },
    orientationDegrees: { type: Number, required: true, min: 0, max: 360 },
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// Project schema
// ---------------------------------------------------------------------------

const ProjectSchema = new Schema<ProjectDocument>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [1, 'Project name cannot be empty'],
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    plot: { type: PlotSchema, required: true },
    floors: { type: [FloorSchema], default: [] },
    settings: { type: ProjectSettingsSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------
ProjectSchema.index({ name: 1 });
ProjectSchema.index({ createdAt: -1 });

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

export const ProjectModel: Model<ProjectDocument> =
  mongoose.models.Project || mongoose.model<ProjectDocument>('Project', ProjectSchema);
