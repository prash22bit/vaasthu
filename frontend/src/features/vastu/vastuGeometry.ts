/**
 * vastuGeometry.ts — VastuPlan Canonical Geometry Module
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * COORDINATE SYSTEM — READ THIS BEFORE EDITING
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Canvas coordinate system (established in Phase 1–3):
 *
 *   (0,0) ──────────────→ X   (+X = East)
 *     │
 *     │
 *     ↓ Y                     (+Y = South)
 *
 * Plot occupies: [0, plot.width] × [0, plot.length] in world units (ft or m)
 *
 *   x = 0           → West boundary
 *   x = plot.width  → East boundary
 *   y = 0           → North boundary
 *   y = plot.length → South boundary
 *
 * This mapping is FIXED regardless of plot.facing.
 *   plot.facing indicates which boundary is the "front face"
 *   (e.g. East-facing → East boundary is the street side).
 *   It does NOT rotate the zone grid — zones are always absolute directions.
 *
 * Normalized coordinates:
 *   nx = x / plot.width   ∈ [0, 1]   (0 = West,  1 = East)
 *   ny = y / plot.length  ∈ [0, 1]   (0 = North, 1 = South)
 *
 * Zone grid in normalized space:
 *
 *   ny=0 ┌─────────┬─────────┬─────────┐
 *  (N)   │   NW    │    N    │   NE    │
 *        ├─────────┼─────────┼─────────┤
 *        │    W    │ CENTER  │    E    │
 *        ├─────────┼─────────┼─────────┤
 *   ny=1 │   SW    │    S    │   SE    │
 *  (S)   └─────────┴─────────┴─────────┘
 *        nx=0                       nx=1
 *       (W)                         (E)
 *
 * ALL direction logic in the Vastu engine MUST use worldVectorToCompassDirection()
 * as the single authoritative transformation. Never derive directions ad-hoc.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type {
  Plot,
  DesignEntity,
  WallEntity,
  RoomEntity,
  DoorEntity,
  GateEntity,
  WorldPoint,
  WorldBounds,
  NormalizedBounds,
  BoundarySide,
  BoundaryPosition,
  VastuDirection,
} from '@vastuplan/shared';

// ── Zone Configuration ───────────────────────────────────────────────────────

export interface VastuZoneConfig {
  /** Normalized X start of center zone. Default: 1/3 */
  centerXStart: number;
  /** Normalized X end of center zone. Default: 2/3 */
  centerXEnd: number;
  /** Normalized Y start of center zone. Default: 1/3 */
  centerYStart: number;
  /** Normalized Y end of center zone. Default: 2/3 */
  centerYEnd: number;
}

/** Default 3×3 equal-thirds zone configuration */
export const DEFAULT_ZONE_CONFIG: VastuZoneConfig = {
  centerXStart: 1 / 3,
  centerXEnd: 2 / 3,
  centerYStart: 1 / 3,
  centerYEnd: 2 / 3,
};

// ── Entity Bounds ─────────────────────────────────────────────────────────────

export interface EntityBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  center: WorldPoint;
}

// ── CANONICAL DIRECTION FUNCTION ─────────────────────────────────────────────

/**
 * CANONICAL function for converting a 2D canvas vector to a compass direction.
 *
 * Coordinate convention:
 *   +dx = East,  -dx = West
 *   +dy = South, -dy = North   (canvas Y increases downward → South)
 *
 * ALL direction calculations in vastuEngine, vastuEvaluator, vastuZones, and
 * VastuHeatmapLayer MUST call this function. Never derive compass directions
 * independently to avoid heatmap/analysis/label inconsistencies.
 *
 * @returns The 8-point compass direction of the (dx, dy) vector,
 *          or 'CENTER' if the vector is zero-length.
 */
export function worldVectorToCompassDirection(dx: number, dy: number): VastuDirection {
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return 'CENTER';

  // Math.atan2(dy, dx) range: (-π, π]
  // atan2 = 0    → East  (dx>0, dy=0)
  // atan2 = π/2  → South (dx=0, dy>0)
  // atan2 = π    → West  (dx<0, dy=0)
  // atan2 = -π/2 → North (dx=0, dy<0)
  const radians = Math.atan2(dy, dx);
  const degrees = radians * (180 / Math.PI);

  // Convert atan2 degrees to compass bearing (N=0°, E=90°, S=180°, W=270°)
  // Compass = (atan2_degrees + 90 + 360) % 360
  // Verification:
  //   East  (atan2=0):    (0   + 90) % 360 = 90  ✓
  //   South (atan2=90):   (90  + 90) % 360 = 180 ✓
  //   West  (atan2=±180): (180 + 90) % 360 = 270 ✓
  //   North (atan2=-90):  (-90 + 90 + 360) % 360 = 0 ✓
  const compassBearing = ((degrees + 90) % 360 + 360) % 360;

  if (compassBearing < 22.5)  return 'N';
  if (compassBearing < 67.5)  return 'NE';
  if (compassBearing < 112.5) return 'E';
  if (compassBearing < 157.5) return 'SE';
  if (compassBearing < 202.5) return 'S';
  if (compassBearing < 247.5) return 'SW';
  if (compassBearing < 292.5) return 'W';
  if (compassBearing < 337.5) return 'NW';
  return 'N'; // 337.5–360
}

// ── Plot Normalization ────────────────────────────────────────────────────────

/**
 * Convert a world-coordinate point to normalized [0,1] plot coordinates.
 * nx=0=West, nx=1=East, ny=0=North, ny=1=South
 */
export function normalizePlotPoint(
  point: WorldPoint,
  plot: Plot
): { nx: number; ny: number } {
  return {
    nx: plot.width  > 0 ? point.x / plot.width  : 0,
    ny: plot.length > 0 ? point.y / plot.length : 0,
  };
}

/**
 * Convert normalized coordinates back to world coordinates.
 */
export function denormalizePlotPoint(
  nx: number,
  ny: number,
  plot: Plot
): WorldPoint {
  return {
    x: nx * plot.width,
    y: ny * plot.length,
  };
}

// ── Zone Classification ───────────────────────────────────────────────────────

/**
 * Determine which Vastu zone a normalized point belongs to.
 *
 * Uses the configurable zone boundaries (default: equal thirds).
 * See coordinate system diagram at the top of this file.
 */
export function getZoneForNormalizedPoint(
  nx: number,
  ny: number,
  config: VastuZoneConfig = DEFAULT_ZONE_CONFIG
): VastuDirection {
  const { centerXStart: cx1, centerXEnd: cx2, centerYStart: cy1, centerYEnd: cy2 } = config;

  // Clamp to [0,1] — points outside the plot are clamped to the nearest edge
  const x = Math.max(0, Math.min(1, nx));
  const y = Math.max(0, Math.min(1, ny));

  const inCenterX = x >= cx1 && x <= cx2;
  const inCenterY = y >= cy1 && y <= cy2;

  if (inCenterX && inCenterY) return 'CENTER';

  // Column: W | Center | E
  const col: 'W' | 'C' | 'E' = x < cx1 ? 'W' : x > cx2 ? 'E' : 'C';
  // Row: N | Center | S
  const row: 'N' | 'C' | 'S' = y < cy1 ? 'N' : y > cy2 ? 'S' : 'C';

  if (row === 'N' && col === 'W') return 'NW';
  if (row === 'N' && col === 'C') return 'N';
  if (row === 'N' && col === 'E') return 'NE';
  if (row === 'C' && col === 'W') return 'W';
  if (row === 'C' && col === 'E') return 'E';
  if (row === 'S' && col === 'W') return 'SW';
  if (row === 'S' && col === 'C') return 'S';
  if (row === 'S' && col === 'E') return 'SE';

  return 'CENTER'; // unreachable but satisfies TypeScript
}

/**
 * Determine which Vastu zone a world-coordinate point belongs to.
 */
export function getZoneForWorldPoint(
  point: WorldPoint,
  plot: Plot,
  config: VastuZoneConfig = DEFAULT_ZONE_CONFIG
): VastuDirection {
  const { nx, ny } = normalizePlotPoint(point, plot);
  return getZoneForNormalizedPoint(nx, ny, config);
}

// ── Entity Geometry ───────────────────────────────────────────────────────────

/**
 * Get the axis-aligned bounding box of any design entity.
 * Works in world coordinates, independent of Konva/canvas rendering.
 */
export function getEntityBounds(entity: DesignEntity): EntityBounds {
  const { position, dimensions } = entity;

  // For wall entities, use actual start/end points for accurate bounds
  if (entity.type === 'wall') {
    const wall = entity as WallEntity;
    const { startX, startY, endX, endY } = wall.properties;
    const minX = Math.min(startX, endX);
    const minY = Math.min(startY, endY);
    const maxX = Math.max(startX, endX);
    const maxY = Math.max(startY, endY);
    const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, center };
  }

  // For all other entities: use position (top-left) + dimensions
  const minX = position.x;
  const minY = position.y;
  const maxX = position.x + dimensions.width;
  const maxY = position.y + dimensions.height;
  const center = {
    x: position.x + dimensions.width  / 2,
    y: position.y + dimensions.height / 2,
  };
  return { minX, minY, maxX, maxY, width: dimensions.width, height: dimensions.height, center };
}

/**
 * Get the geometric center of any design entity in world coordinates.
 * This is used for zone classification.
 */
export function getEntityCenter(entity: DesignEntity): WorldPoint {
  return getEntityBounds(entity).center;
}

/**
 * Get a human-readable label for a design entity.
 */
export function getEntityLabel(entity: DesignEntity): string {
  if (entity.type === 'room') {
    const room = entity as RoomEntity;
    return room.properties.displayName || room.properties.name || 'Room';
  }
  if (entity.type === 'door') {
    const door = entity as DoorEntity;
    if (door.properties.doorRole === 'main-entrance') return 'Main Entrance';
    return 'Door';
  }
  const typeLabels: Partial<Record<string, string>> = {
    wall: 'Wall', window: 'Window', staircase: 'Staircase',
    column: 'Column', parking: 'Parking', garden: 'Garden',
    'compound-wall': 'Compound Wall', gate: 'Gate', dimension: 'Dimension',
  };
  return typeLabels[entity.type] ?? entity.type;
}

/**
 * Classify a design entity into a Vastu zone based on its geometric center.
 * Center-based classification is the primary method for Phase 4.
 * Overlap-aware analysis is prepared for Phase 5.
 */
export function classifyEntityZone(
  entity: DesignEntity,
  plot: Plot,
  config: VastuZoneConfig = DEFAULT_ZONE_CONFIG
): VastuDirection {
  const center = getEntityCenter(entity);
  return getZoneForWorldPoint(center, plot, config);
}

// ── Boundary / Entrance Architecture ─────────────────────────────────────────

/** Threshold (world units) within which an entity is considered "on" a boundary */
const BOUNDARY_PROXIMITY_THRESHOLD = 5.0; // feet

/**
 * Determine which boundary wall a door or gate is positioned on.
 *
 * Architecture note: This function prepares the foundation for
 * future pada (sub-zone) analysis of entrances (Phase 5+).
 * Each boundary wall can be divided into 9 padas.
 *
 * Returns null if the entity is not near any boundary wall.
 */
export function getBoundaryPosition(
  entity: DesignEntity,
  plot: Plot
): BoundaryPosition | null {
  const center = getEntityCenter(entity);
  const { x, y } = center;
  const { width: W, length: L } = plot;

  const distToN = y;
  const distToS = L - y;
  const distToW = x;
  const distToE = W - x;

  const minDist = Math.min(distToN, distToS, distToW, distToE);
  if (minDist > BOUNDARY_PROXIMITY_THRESHOLD) return null;

  let side: BoundarySide;
  let relativePosition: number;

  if (minDist === distToN) {
    side = 'N';
    relativePosition = W > 0 ? x / W : 0;
  } else if (minDist === distToS) {
    side = 'S';
    relativePosition = W > 0 ? x / W : 0;
  } else if (minDist === distToW) {
    side = 'W';
    relativePosition = L > 0 ? y / L : 0;
  } else {
    side = 'E';
    relativePosition = L > 0 ? y / L : 0;
  }

  // Clamp and compute pada (1–9) — prepared for Phase 5 entrance analysis
  const rp = Math.max(0, Math.min(1, relativePosition));
  const pada = Math.min(9, Math.floor(rp * 9) + 1);

  return { side, relativePosition: rp, pada };
}

/**
 * Determine which boundary side a structural wall segment lies on.
 *
 * A wall is considered to be "on" a boundary if both its endpoints
 * are within BOUNDARY_PROXIMITY_THRESHOLD of the same plot edge.
 *
 * Returns null if the wall is an interior wall.
 */
export function getWallSide(wall: WallEntity, plot: Plot): BoundarySide | null {
  const { startX, startY, endX, endY } = wall.properties;
  const { width: W, length: L } = plot;
  const T = BOUNDARY_PROXIMITY_THRESHOLD;

  const onNorth = startY <= T && endY <= T;
  const onSouth = (L - startY) <= T && (L - endY) <= T;
  const onWest  = startX <= T && endX <= T;
  const onEast  = (W - startX) <= T && (W - endX) <= T;

  if (onNorth) return 'N';
  if (onSouth) return 'S';
  if (onWest)  return 'W';
  if (onEast)  return 'E';
  return null;
}

/**
 * Get the relative position (0–1) of an entity along a given wall.
 *
 * Uses the projection of the entity center onto the wall line.
 * 0 = start of wall, 1 = end of wall.
 *
 * Prepared for Phase 5 pada-based entrance analysis.
 */
export function getRelativePositionAlongWall(
  entity: DesignEntity,
  wall: WallEntity
): number {
  const center = getEntityCenter(entity);
  const { startX, startY, endX, endY } = wall.properties;

  const dx = endX - startX;
  const dy = endY - startY;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-9) return 0;

  const t = ((center.x - startX) * dx + (center.y - startY) * dy) / lenSq;
  return Math.max(0, Math.min(1, t));
}

// ── WorldBounds helpers ───────────────────────────────────────────────────────

/**
 * Convert normalized bounds to world bounds for a given plot.
 */
export function normalizedToWorldBounds(
  nb: NormalizedBounds,
  plot: Plot
): WorldBounds {
  return {
    x: nb.minX * plot.width,
    y: nb.minY * plot.length,
    width:  (nb.maxX - nb.minX) * plot.width,
    height: (nb.maxY - nb.minY) * plot.length,
  };
}

/**
 * Get the center WorldPoint of a WorldBounds rectangle.
 */
export function getWorldBoundsCenter(bounds: WorldBounds): WorldPoint {
  return {
    x: bounds.x + bounds.width  / 2,
    y: bounds.y + bounds.height / 2,
  };
}
