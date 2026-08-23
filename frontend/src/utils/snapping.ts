import type { WorldPoint, DesignEntity, WallEntity, RoomEntity } from '@vastuplan/shared';
import { distanceBetweenPoints, projectPointOntoLine, snapPointToGrid } from './geometry';

export type SnapType = 'endpoint' | 'midpoint' | 'wall' | 'grid' | 'none';

export interface SnapResult {
  /** The final snapped world point */
  point: WorldPoint;
  /** Type of snapping applied */
  type: SnapType;
  /** Target entity ID if snapped to entity */
  targetEntityId?: string;
  /** Point to draw the snap indicator */
  indicatorPoint?: WorldPoint;
}

export interface SnappingOptions {
  /** Snap distance threshold in world units (e.g. 1.0 ft) */
  threshold?: number;
  /** Whether grid snapping is active */
  gridSnapEnabled?: boolean;
  /** Grid cell size */
  cellSize?: number;
  /** Ignore entity ID (e.g., currently selected/moving entity) */
  ignoreEntityIds?: string[];
}

/**
 * Prioritized Snapping Engine for CAD drawing:
 * Priority 1: Endpoint Snap (Wall endpoints, Room corners)
 * Priority 2: Midpoint Snap (Wall midpoints, Room edge midpoints)
 * Priority 3: Wall Line Snap (Points along a wall segment)
 * Priority 4: Grid Snap (Nearest grid intersection)
 */
export function getSnapPoint(
  cursor: WorldPoint,
  entities: DesignEntity[],
  options: SnappingOptions = {}
): SnapResult {
  const {
    threshold = 1.0,
    gridSnapEnabled = true,
    cellSize = 1,
    ignoreEntityIds = [],
  } = options;

  const validEntities = entities.filter((e) => !ignoreEntityIds.includes(e.id));

  // ── 1. ENDPOINT SNAP (highest priority) ──
  let closestEndpoint: WorldPoint | null = null;
  let minEndpointDist = threshold;
  let endpointTargetId: string | undefined;

  for (const entity of validEntities) {
    if (entity.type === 'wall') {
      const wall = entity as unknown as WallEntity;
      const p1 = { x: wall.properties.startX, y: wall.properties.startY };
      const p2 = { x: wall.properties.endX, y: wall.properties.endY };

      const d1 = distanceBetweenPoints(cursor, p1);
      if (d1 < minEndpointDist) {
        minEndpointDist = d1;
        closestEndpoint = p1;
        endpointTargetId = entity.id;
      }

      const d2 = distanceBetweenPoints(cursor, p2);
      if (d2 < minEndpointDist) {
        minEndpointDist = d2;
        closestEndpoint = p2;
        endpointTargetId = entity.id;
      }
    } else if (entity.type === 'room') {
      const room = entity as unknown as RoomEntity;
      const corners: WorldPoint[] = [
        { x: room.position.x, y: room.position.y },
        { x: room.position.x + room.dimensions.width, y: room.position.y },
        { x: room.position.x, y: room.position.y + room.dimensions.height },
        { x: room.position.x + room.dimensions.width, y: room.position.y + room.dimensions.height },
      ];

      for (const corner of corners) {
        const d = distanceBetweenPoints(cursor, corner);
        if (d < minEndpointDist) {
          minEndpointDist = d;
          closestEndpoint = corner;
          endpointTargetId = entity.id;
        }
      }
    }
  }

  if (closestEndpoint) {
    return {
      point: closestEndpoint,
      type: 'endpoint',
      targetEntityId: endpointTargetId,
      indicatorPoint: closestEndpoint,
    };
  }

  // ── 2. MIDPOINT SNAP ──
  let closestMidpoint: WorldPoint | null = null;
  let minMidpointDist = threshold;
  let midpointTargetId: string | undefined;

  for (const entity of validEntities) {
    if (entity.type === 'wall') {
      const wall = entity as unknown as WallEntity;
      const mid = {
        x: (wall.properties.startX + wall.properties.endX) / 2,
        y: (wall.properties.startY + wall.properties.endY) / 2,
      };
      const d = distanceBetweenPoints(cursor, mid);
      if (d < minMidpointDist) {
        minMidpointDist = d;
        closestMidpoint = mid;
        midpointTargetId = entity.id;
      }
    }
  }

  if (closestMidpoint) {
    return {
      point: closestMidpoint,
      type: 'midpoint',
      targetEntityId: midpointTargetId,
      indicatorPoint: closestMidpoint,
    };
  }

  // ── 3. WALL LINE SNAP ──
  let closestWallPoint: WorldPoint | null = null;
  let minWallDist = threshold;
  let wallTargetId: string | undefined;

  for (const entity of validEntities) {
    if (entity.type === 'wall') {
      const wall = entity as unknown as WallEntity;
      const p1 = { x: wall.properties.startX, y: wall.properties.startY };
      const p2 = { x: wall.properties.endX, y: wall.properties.endY };
      const proj = projectPointOntoLine(cursor, p1, p2);

      if (proj.distance < minWallDist && proj.t > 0.05 && proj.t < 0.95) {
        minWallDist = proj.distance;
        closestWallPoint = proj.point;
        wallTargetId = entity.id;
      }
    }
  }

  if (closestWallPoint) {
    return {
      point: closestWallPoint,
      type: 'wall',
      targetEntityId: wallTargetId,
      indicatorPoint: closestWallPoint,
    };
  }

  // ── 4. GRID SNAP ──
  if (gridSnapEnabled) {
    const gridPoint = snapPointToGrid(cursor, cellSize);
    return {
      point: gridPoint,
      type: 'grid',
      indicatorPoint: gridPoint,
    };
  }

  // ── 5. NO SNAP ──
  return {
    point: cursor,
    type: 'none',
  };
}
