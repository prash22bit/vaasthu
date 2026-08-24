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
  | 'garden'
  | 'compound-wall'
  | 'gate';

/**
 * Base interface for all design entities.
 */
export interface DesignEntity {
  id: string;
  type: DesignEntityType;
  /** World-coordinate position (top-left origin for room, start point for wall) */
  position: WorldPoint;
  /** Rotation in degrees (clockwise) */
  rotation: number;
  /** World-coordinate dimensions */
  dimensions: WorldDimensions;
  /** Entity-specific properties */
  properties: Record<string, unknown>;
  /** Floor index this entity belongs to */
  floorIndex: number;
  /** Whether the entity is locked (cannot be moved/edited) */
  locked: boolean;
  /** Whether the entity is visible */
  visible: boolean;
}

// ---------------------------------------------------------------------------
// Specific Entity Property Interfaces
// ---------------------------------------------------------------------------

export interface WallProperties {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  /** Thickness in world units (e.g. 0.375 ft for 4.5 inches, 0.5 ft for 6 inches) */
  thickness: number;
  [key: string]: unknown;
}

export interface WallEntity extends DesignEntity {
  type: 'wall';
  properties: WallProperties;
}

export interface RoomProperties {
  name: string;
  roomType?: string;
  displayName?: string;
  color?: string;
  [key: string]: unknown;
}

export interface RoomEntity extends DesignEntity {
  type: 'room';
  properties: RoomProperties;
}

export interface DimensionProperties {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  /** Optional ID of entity being measured (wall or room) for associative updates */
  associatedEntityId?: string;
  measurementType?: 'length' | 'width' | 'custom';
  offset: number;
  [key: string]: unknown;
}

export interface DimensionEntity extends DesignEntity {
  type: 'dimension';
  properties: DimensionProperties;
}

export interface DoorProperties {
  hostWallId: string;
  offsetAlongWall: number;
  doorType: 'single' | 'double' | 'sliding' | 'folding';
  swingDirection: 'left' | 'right';
  swingOrientation: 'inward' | 'outward';
  width: number;
  height: number;
  /**
   * Semantic role of this door on the floor.
   * Only one door per floor should have doorRole === 'main-entrance'.
   * The UI must enforce this constraint when marking a door as main entrance.
   */
  doorRole?: 'main-entrance' | 'interior' | 'service' | 'other';
  [key: string]: unknown;
}

export interface DoorEntity extends DesignEntity {
  type: 'door';
  properties: DoorProperties;
}

export interface WindowProperties {
  hostWallId: string;
  offsetAlongWall: number;
  windowType: 'single' | 'double' | 'sliding' | 'bay';
  width: number;
  height: number;
  [key: string]: unknown;
}

export interface WindowEntity extends DesignEntity {
  type: 'window';
  properties: WindowProperties;
}

export interface StaircaseProperties {
  staircaseType: 'straight' | 'l-shaped' | 'u-shaped' | 'spiral';
  steps: number;
  direction: 'up' | 'down';
  width: number;
  [key: string]: unknown;
}

export interface StaircaseEntity extends DesignEntity {
  type: 'staircase';
  properties: StaircaseProperties;
}

export interface ColumnProperties {
  width: number;
  depth: number;
  diameter?: number;
  shape: 'rectangle' | 'circle';
  [key: string]: unknown;
}

export interface ColumnEntity extends DesignEntity {
  type: 'column';
  properties: ColumnProperties;
}

export interface ParkingProperties {
  parkingType: 'car' | 'bike' | 'mixed';
  vehicleCount: number;
  [key: string]: unknown;
}

export interface ParkingEntity extends DesignEntity {
  type: 'parking';
  properties: ParkingProperties;
}

export interface GardenProperties {
  gardenType: 'garden' | 'lawn' | 'courtyard' | 'open-space';
  [key: string]: unknown;
}

export interface GardenEntity extends DesignEntity {
  type: 'garden';
  properties: GardenProperties;
}

export interface CompoundWallSegment {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface CompoundWallProperties {
  segments: CompoundWallSegment[];
  thickness: number;
  [key: string]: unknown;
}

export interface CompoundWallEntity extends DesignEntity {
  type: 'compound-wall';
  properties: CompoundWallProperties;
}

export interface GateProperties {
  hostCompoundWallId: string;
  hostSegmentId: string;
  offsetAlongWall: number;
  gateType: 'single' | 'double' | 'sliding';
  width: number;
  [key: string]: unknown;
}

export interface GateEntity extends DesignEntity {
  type: 'gate';
  properties: GateProperties;
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
  | 'ROTATE_ENTITY'
  | 'ATTACH_ENTITY'
  | 'DETACH_ENTITY'
  | 'CREATE_FLOOR'
  | 'DELETE_FLOOR'
  | 'UPDATE_SETTINGS'
  | 'AI_PROPOSAL';

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
// Vastu Intelligence Engine — Phase 4 Types
// ---------------------------------------------------------------------------

/**
 * Eight compass directions + center used throughout the Vastu engine.
 * Abbreviated for concise code. Use VASTU_DIRECTION_LABELS for display.
 *
 * CANONICAL COORDINATE MAPPING (see vastuGeometry.ts):
 *   Canvas +X = East, Canvas +Y = South (Y increases downward)
 *   N = top of canvas (y=0), S = bottom (y=plotLength)
 *   W = left  (x=0),        E = right  (x=plotWidth)
 */
export type VastuDirection =
  | 'N' | 'NE' | 'E' | 'SE'
  | 'S' | 'SW' | 'W' | 'NW'
  | 'CENTER';

export const VASTU_DIRECTION_LABELS: Record<VastuDirection, string> = {
  N: 'North', NE: 'North-East', E: 'East', SE: 'South-East',
  S: 'South', SW: 'South-West', W: 'West', NW: 'North-West',
  CENTER: 'Brahmasthan (Center)',
};

/** Normalized [0,1] bounding box independent of plot dimensions */
export interface NormalizedBounds {
  minX: number; // 0 = West
  minY: number; // 0 = North
  maxX: number; // 1 = East
  maxY: number; // 1 = South
}

/**
 * Which boundary wall a door/gate sits on, plus its position along that wall.
 * Prepared for future pada (1–9 sub-zone) analysis.
 */
export type BoundarySide = 'N' | 'S' | 'E' | 'W';

export interface BoundaryPosition {
  side: BoundarySide;
  /** 0 = start of wall, 1 = end of wall */
  relativePosition: number;
  /**
   * Traditional Vastu pada (1–9) along the wall.
   * Computed as: Math.floor(relativePosition * 9) + 1
   * Reserved for Phase 5 entrance analysis.
   */
  pada: number;
}

// ── Vastu Zone ──────────────────────────────────────────────────────────────

export interface VastuZone {
  id: VastuDirection;
  direction: VastuDirection;
  label: string;
  /** World-unit bounds (feet or meters, depends on project unit) */
  worldBounds: WorldBounds;
  /** Normalized [0,1] bounds — plot-dimension independent */
  normalizedBounds: NormalizedBounds;
  /** Center of zone in world coordinates */
  center: WorldPoint;
}

/** Map from direction to zone — produced by buildVastuZones() */
export type VastuZoneMap = Partial<Record<VastuDirection, VastuZone>>;

// ── Vastu Rule System ───────────────────────────────────────────────────────

export type VastuRuleSeverity = 'info' | 'positive' | 'warning' | 'critical';

export type VastuRuleStatus =
  | 'pass'
  | 'preferred'
  | 'acceptable'
  | 'warning'
  | 'violation'
  | 'not-applicable';

export type VastuRuleCategory =
  | 'entrance'
  | 'kitchen'
  | 'master-bedroom'
  | 'bedrooms'
  | 'pooja-room'
  | 'bathroom-toilet'
  | 'staircase'
  | 'living-area'
  | 'parking'
  | 'garden'
  | 'brahmasthan'
  | 'general';

export type VastuZoneSystem = '3x3' | '8-direction' | '16-zone' | '32-zone' | '64-zone';

export type VastuStrictness = 'relaxed' | 'balanced' | 'strict';

/**
 * Data-driven Vastu rule descriptor.
 * The evaluator (vastuEvaluator.ts) iterates these; no per-rule if/else.
 * All rules must declare their source as 'traditional-guidance' —
 * NEVER 'scientific', 'proven', or 'building-code'.
 */
export interface VastuRuleDefinition {
  id: string;
  name: string;
  /** Rule-set this rule belongs to. Allows future alternative rule sets. */
  ruleSetId: string;
  /**
   * Source classification. ALWAYS 'traditional-guidance' for Vastu rules.
   * This distinction prevents Vastu rules from being confused with
   * engineering, structural, or regulatory requirements.
   */
  sourceType: 'traditional-guidance';
  category: VastuRuleCategory;
  /** Entity types this rule applies to (empty = all) */
  targetEntityTypes?: DesignEntityType[];
  /** roomType values this rule applies to (for room entities) */
  targetRoomTypes?: string[];
  preferredZones: VastuDirection[];
  acceptableZones: VastuDirection[];
  avoidZones: VastuDirection[];
  /** Default severity when rule is violated */
  severity: VastuRuleSeverity;
  /** Score contribution (0–10). Higher = more important. */
  weight: number;
  /** Minimum strictness level at which this rule is applied */
  strictnessThreshold: VastuStrictness;
  /** Non-scientific explanation suitable for display */
  explanation: string;
  /** Actionable recommendation when rule is not satisfied */
  recommendation: string;
}

/** Result of evaluating one rule against one entity */
export interface VastuRuleResult {
  ruleId: string;
  ruleName: string;
  ruleCategory: VastuRuleCategory;
  entityId: string;
  entityType: DesignEntityType;
  /** Human-readable entity label (e.g. "Kitchen", "Master Bedroom") */
  entityLabel: string;
  status: VastuRuleStatus;
  severity: VastuRuleSeverity;
  /** Positive or negative score contribution */
  scoreImpact: number;
  /** Current zone where entity is located */
  currentZone: VastuDirection | null;
  message: string;
  explanation: string;
  recommendation: string;
}

// ── Scoring ─────────────────────────────────────────────────────────────────

export interface VastuCategoryScore {
  category: VastuRuleCategory;
  label: string;
  score: number;     // 0–100
  maxScore: number;  // maximum achievable in category
  ruleCount: number;
  status: VastuRuleStatus; // worst status in category
}

// ── Settings ────────────────────────────────────────────────────────────────

export interface VastuSettings {
  /** Which rule set to use. Default: 'traditional-v1' */
  ruleSetId: string;
  /** Zone subdivision system. Default: '3x3' */
  zoneSystem: VastuZoneSystem;
  strictness: VastuStrictness;
  showHeatmap: boolean;
  showEntityHighlights: boolean;
}

export const DEFAULT_VASTU_SETTINGS: VastuSettings = {
  ruleSetId: 'traditional-v1',
  zoneSystem: '3x3',
  strictness: 'balanced',
  showHeatmap: true,
  showEntityHighlights: true,
};

// ── Analysis Snapshot ───────────────────────────────────────────────────────

export interface VastuRecommendation {
  entityId: string;
  entityType: DesignEntityType;
  entityLabel: string;
  issue: string;
  currentZone: VastuDirection | null;
  preferredZones: VastuDirection[];
  reason: string;
  severity: VastuRuleSeverity;
  ruleId: string;
}

export interface VastuAnalysis {
  projectId: string;
  floorIndex: number;
  ruleSetId: string;
  /** Lightweight hash of design state at analysis time. Used for stale detection. */
  designHash: string;
  overallScore: number;  // 0–100
  categoryScores: VastuCategoryScore[];
  /** Map of direction → VastuZone for this analysis */
  zoneMap: VastuZoneMap;
  ruleResults: VastuRuleResult[];
  warnings: string[];
  recommendations: VastuRecommendation[];
  analyzedAt: string; // ISO 8601
  settings: VastuSettings;
}

// Keep VastuZoneType alias for backward compatibility with existing code
export type VastuZoneType = VastuDirection;

// ---------------------------------------------------------------------------
// AI Design Assistant — Phase 5 Types
// ---------------------------------------------------------------------------

export type AICommandType =
  | 'create_room'
  | 'delete_entity'
  | 'move_entity'
  | 'resize_entity'
  | 'rotate_entity'
  | 'update_entity_properties'
  | 'create_wall'
  | 'create_door'
  | 'create_window'
  | 'create_staircase'
  | 'create_column'
  | 'create_parking'
  | 'create_garden'
  | 'create_compound_wall'
  | 'create_gate'
  | 'duplicate_entity';

export interface AICommand {
  id: string;
  action: AICommandType;
  entityId?: string;
  entityType?: DesignEntityType;
  params: Record<string, unknown>;
  /** Human-readable description of what this command does */
  description: string;
  /** Why the AI chose this action */
  reason?: string;
  /** AI's confidence in this specific command (0–1) */
  confidence?: number;
}

export type AIProposalStatus =
  | 'pending-validation'
  | 'valid'
  | 'invalid'
  | 'approved'
  | 'rejected'
  | 'applied';

export interface AIValidationError {
  commandId?: string;
  reason: string;
  severity: 'error' | 'warning';
}

export interface AIProposal {
  id: string;
  title: string;
  explanation: string;
  commands: AICommand[];
  validationErrors: AIValidationError[];
  warnings: string[];
  status: AIProposalStatus;
  createdAt: string; // ISO 8601
  /** Vastu score of the current design at proposal time */
  currentVastuScore?: number;
  /** Estimated Vastu score after applying this proposal */
  proposedVastuScore?: number;
}

// ── AI Chat ─────────────────────────────────────────────────────────────

export type AIChatRole = 'user' | 'assistant' | 'system';

export interface AIChatMessage {
  id: string;
  role: AIChatRole;
  content: string;
  /** If assistant message includes a design proposal */
  proposal?: AIProposal;
  timestamp: string; // ISO 8601
}

export interface AIDesignContext {
  projectId: string;
  projectName: string;
  plot: Plot;
  floorIndex: number;
  entities: DesignEntity[];
  selectedEntityIds: string[];
  vastuAnalysis?: VastuAnalysis;
}

export interface AIChatRequest {
  message: string;
  context: AIDesignContext;
  conversationHistory: AIChatMessage[];
}

export interface AIChatResponse {
  message: string;
  proposal?: AIProposal;
  confidence?: number;
  requiresClarification?: boolean;
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
