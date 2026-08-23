// =============================================================================
// VastuPlan — Shared Domain Types
// These types are shared between frontend and backend.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums / Union Types
// ---------------------------------------------------------------------------

export type PlotShape = 'rectangle' | 'square' | 'l-shaped' | 'custom';

export type FacingDirection =
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'north-east'
  | 'north-west'
  | 'south-east'
  | 'south-west';

export type Unit = 'feet' | 'meters';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

// ---------------------------------------------------------------------------
// Coordinate System
// ---------------------------------------------------------------------------

/** A point in world coordinates (real-world units: feet or meters) */
export interface WorldPoint {
  x: number;
  y: number;
}

/** A point in screen coordinates (pixels) */
export interface ScreenPoint {
  x: number;
  y: number;
}

/** Dimensions in world units */
export interface WorldDimensions {
  width: number;
  height: number;
}

/** Axis-aligned bounding box in world coordinates */
export interface WorldBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Plot
// ---------------------------------------------------------------------------

export interface Plot {
  shape: PlotShape;
  /** Length = dimension along Y axis (depth) */
  length: number;
  /** Width = dimension along X axis */
  width: number;
  unit: Unit;
  facing: FacingDirection;
  /**
   * Orientation in degrees from North (clockwise).
   * 0 = North, 90 = East, 180 = South, 270 = West.
   * Derived from `facing` but stored for future precise azimuth support.
   */
  orientationDegrees: number;
}

// ---------------------------------------------------------------------------
// Design Entities (extensible base for all CAD objects)
// ---------------------------------------------------------------------------

export type DesignEntityType =
  | 'plot'
  | 'wall'
  | 'room'
  | 'door'
  | 'window'
  | 'staircase'
  | 'column'
  | 'furniture'
  | 'dimension'
  | 'text'
  | 'electrical-point'
  | 'plumbing-point'
  | 'parking'
  | 'garden';

/**
 * Base interface for all design entities.
 * Future phases will extend this with entity-specific fields.
 */
export interface DesignEntity {
  id: string;
  type: DesignEntityType;
  /** World-coordinate position (top-left origin) */
  position: WorldPoint;
  /** Rotation in degrees (clockwise) */
  rotation: number;
  /** World-coordinate dimensions */
  dimensions: WorldDimensions;
  /** Entity-specific properties (open-ended for future entities) */
  properties: Record<string, unknown>;
  /** Floor index this entity belongs to */
  floorIndex: number;
  /** Whether the entity is locked (cannot be moved/edited) */
  locked: boolean;
  /** Whether the entity is visible */
  visible: boolean;
}

// ---------------------------------------------------------------------------
// Floor
// ---------------------------------------------------------------------------

export interface Floor {
  id: string;
  name: string;
  level: number; // 0 = Ground, 1 = First, 2 = Second, 3 = Terrace, etc.
  entities: DesignEntity[];
  /** Floor height in world units */
  floorHeight: number;
}

// ---------------------------------------------------------------------------
// Project Settings
// ---------------------------------------------------------------------------

export interface GridSettings {
  visible: boolean;
  /** Grid cell size in world units */
  cellSize: number;
  snapToGrid: boolean;
}

export interface ProjectSettings {
  grid: GridSettings;
  defaultUnit: Unit;
  /** Whether to show dimension labels */
  showDimensions: boolean;
  /** Whether to show compass */
  showCompass: boolean;
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  name: string;
  plot: Plot;
  /** Array of floors. Index 0 = Ground Floor */
  floors: Floor[];
  settings: ProjectSettings;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** Payload for creating a new project (id and timestamps are generated server-side) */
export type CreateProjectPayload = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

/** Payload for updating a project */
export type UpdateProjectPayload = Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>;

// ---------------------------------------------------------------------------
// History / Undo-Redo Architecture
// ---------------------------------------------------------------------------

export type HistoryActionType =
  | 'UPDATE_PLOT'
  | 'CREATE_ENTITY'
  | 'UPDATE_ENTITY'
  | 'DELETE_ENTITY'
  | 'MOVE_ENTITY'
  | 'RESIZE_ENTITY'
  | 'CREATE_FLOOR'
  | 'DELETE_FLOOR'
  | 'UPDATE_SETTINGS';

export interface HistoryAction {
  id: string;
  type: HistoryActionType;
  timestamp: number;
  /** State snapshot before this action */
  before: unknown;
  /** State snapshot after this action */
  after: unknown;
  /** Human-readable description */
  description: string;
}

// ---------------------------------------------------------------------------
// Vastu Architecture (stubs — to be implemented in Phase 3)
// ---------------------------------------------------------------------------

export type VastuZoneType =
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'north-east'
  | 'north-west'
  | 'south-east'
  | 'south-west'
  | 'center';

export type VastuSeverity = 'good' | 'neutral' | 'warning' | 'critical';

export interface VastuZone {
  type: VastuZoneType;
  bounds: WorldBounds;
  /** List of recommended uses for this zone */
  recommendedUses: string[];
  /** List of uses to avoid in this zone */
  avoidedUses: string[];
}

export interface VastuRule {
  id: string;
  name: string;
  description: string;
  severity: VastuSeverity;
  /** Function that evaluates the rule — implemented in Phase 3 */
  evaluate?: (project: Project) => VastuViolation | null;
}

export interface VastuViolation {
  ruleId: string;
  severity: VastuSeverity;
  message: string;
  affectedEntityIds: string[];
  suggestion: string;
}

export interface VastuAnalysis {
  projectId: string;
  score: number; // 0–100
  zones: VastuZone[];
  violations: VastuViolation[];
  recommendations: string[];
  analyzedAt: string;
}

// ---------------------------------------------------------------------------
// AI Architecture (stubs — to be implemented in Phase 4)
// ---------------------------------------------------------------------------

export type AICommandType =
  | 'create_room'
  | 'delete_room'
  | 'resize_room'
  | 'move_entity'
  | 'suggest_layout'
  | 'add_furniture'
  | 'optimize_vastu';

export interface AICommand {
  action: AICommandType;
  entityId?: string;
  /** Command-specific parameters */
  params: Record<string, unknown>;
  /** Natural language description of what the command does */
  description: string;
}

export interface AIResponse {
  commands: AICommand[];
  explanation: string;
  confidence: number; // 0–1
}

// ---------------------------------------------------------------------------
// API Response types
// ---------------------------------------------------------------------------

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
  statusCode: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ---------------------------------------------------------------------------
// Direction utilities
// ---------------------------------------------------------------------------

/** Maps facing direction to degrees from North (clockwise) */
export const FACING_DEGREES: Record<FacingDirection, number> = {
  north: 0,
  'north-east': 45,
  east: 90,
  'south-east': 135,
  south: 180,
  'south-west': 225,
  west: 270,
  'north-west': 315,
};

export const ALL_FACING_DIRECTIONS: FacingDirection[] = [
  'north',
  'north-east',
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west',
];

export const FACING_LABELS: Record<FacingDirection, string> = {
  north: 'North',
  'north-east': 'North-East',
  east: 'East',
  'south-east': 'South-East',
  south: 'South',
  'south-west': 'South-West',
  west: 'West',
  'north-west': 'North-West',
};
