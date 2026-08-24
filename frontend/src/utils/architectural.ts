import type {
  WallEntity,
  CompoundWallSegment,
  DoorEntity,
  WindowEntity,
  GateEntity,
  DesignEntity,
  WorldPoint,
  Plot,
  WorldDimensions,
} from '@vastuplan/shared';
import { distanceBetweenPoints, calculateAngle } from './geometry';

export interface HostedPositionResult {
  position: WorldPoint;
  rotation: number; // degrees
  wallLength: number;
}

/**
 * Calculate the world-coordinate position and rotation of an entity hosted on a wall segment at a given offset.
 */
export function calculateHostedPosition(
  segment: { startX: number; startY: number; endX: number; endY: number },
  offsetAlongWall: number
): HostedPositionResult {
  const p1 = { x: segment.startX, y: segment.startY };
  const p2 = { x: segment.endX, y: segment.endY };
  const wallLength = distanceBetweenPoints(p1, p2);
  const angle = calculateAngle(p1, p2);

  if (wallLength <= 0) {
    return { position: { ...p1 }, rotation: angle, wallLength: 0 };
  }

  const t = Math.max(0, Math.min(1, offsetAlongWall / wallLength));
  const position = {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };

  return { position, rotation: angle, wallLength };
}

/**
 * Validate boundary limits and occupancy overlaps for a door/window/gate on a host wall segment.
 */
export function validateWallOccupancy(
  segment: { startX: number; startY: number; endX: number; endY: number },
  existingHosted: { id: string; properties: { offsetAlongWall: number; width: number } }[],
  newOffset: number,
  newWidth: number,
  excludeEntityId?: string
): { valid: boolean; reason?: string } {
  const p1 = { x: segment.startX, y: segment.startY };
  const p2 = { x: segment.endX, y: segment.endY };
  const wallLength = distanceBetweenPoints(p1, p2);

  // 1. Boundary validation
  if (newOffset < -0.01 || newOffset + newWidth > wallLength + 0.01) {
    return {
      valid: false,
      reason: `Component width (${newWidth.toFixed(1)}) does not fit on wall (length ${wallLength.toFixed(1)}) at offset ${newOffset.toFixed(1)}.`,
    };
  }

  // 2. Overlap validation
  const newStart = newOffset;
  const newEnd = newOffset + newWidth;

  for (const item of existingHosted) {
    if (excludeEntityId && item.id === excludeEntityId) continue;

    const existingStart = item.properties.offsetAlongWall;
    const existingEnd = existingStart + item.properties.width;

    // Check interval overlap
    if (newStart < existingEnd - 0.01 && newEnd > existingStart + 0.01) {
      return {
        valid: false,
        reason: `Component overlaps existing component (offset ${existingStart.toFixed(1)} to ${existingEnd.toFixed(1)}).`,
      };
    }
  }

  return { valid: true };
}

/**
 * Recalculate world coordinates for doors and windows hosted on a structural wall when the wall updates.
 */
export function updateHostedEntitiesOnWallUpdate(
  wall: WallEntity,
  entities: DesignEntity[]
): DesignEntity[] {
  const wallSegment = {
    startX: wall.properties.startX,
    startY: wall.properties.startY,
    endX: wall.properties.endX,
    endY: wall.properties.endY,
  };

  return entities.map((entity) => {
    if (
      (entity.type === 'door' || entity.type === 'window') &&
      (entity.properties as { hostWallId?: string }).hostWallId === wall.id
    ) {
      const offset = (entity.properties as { offsetAlongWall: number }).offsetAlongWall;
      const { position, rotation } = calculateHostedPosition(wallSegment, offset);

      return {
        ...entity,
        position,
        rotation,
      };
    }
    return entity;
  });
}

/**
 * Recalculate world coordinates for gates hosted on a compound wall segment when the segment updates.
 */
export function updateHostedGatesOnSegmentUpdate(
  compoundWallId: string,
  segment: CompoundWallSegment,
  entities: DesignEntity[]
): DesignEntity[] {
  return entities.map((entity) => {
    if (entity.type === 'gate') {
      const gate = entity as unknown as GateEntity;
      if (
        gate.properties.hostCompoundWallId === compoundWallId &&
        gate.properties.hostSegmentId === segment.id
      ) {
        const { position, rotation } = calculateHostedPosition(segment, gate.properties.offsetAlongWall);
        return {
          ...entity,
          position,
          rotation,
        };
      }
    }
    return entity;
  });
}

/**
 * Remove orphaned hosted entities (doors, windows, gates) whose host wall or segment no longer exists.
 */
export function cleanOrphanedEntities(entities: DesignEntity[]): DesignEntity[] {
  const wallIds = new Set(entities.filter((e) => e.type === 'wall').map((e) => e.id));
  const compoundWallMap = new Map<string, Set<string>>();

  entities.forEach((e) => {
    if (e.type === 'compound-wall') {
      const segIds = new Set(
        ((e.properties as { segments?: CompoundWallSegment[] }).segments || []).map((s) => s.id)
      );
      compoundWallMap.set(e.id, segIds);
    }
  });

  return entities.filter((entity) => {
    if (entity.type === 'door' || entity.type === 'window') {
      const hostWallId = (entity.properties as { hostWallId?: string }).hostWallId;
      if (!hostWallId || !wallIds.has(hostWallId)) {
        return false; // Remove orphaned door/window
      }
    }

    if (entity.type === 'gate') {
      const hostWallId = (entity.properties as { hostCompoundWallId?: string }).hostCompoundWallId;
      const hostSegmentId = (entity.properties as { hostSegmentId?: string }).hostSegmentId;
      if (!hostWallId || !compoundWallMap.has(hostWallId)) {
        return false; // Remove orphaned gate
      }
      if (hostSegmentId && !compoundWallMap.get(hostWallId)?.has(hostSegmentId)) {
        return false; // Remove gate hosted on deleted segment
      }
    }

    return true;
  });
}

/**
 * Validate whether a component's bounding box is inside the plot boundaries.
 */
export function validatePlotBoundary(
  position: WorldPoint,
  dimensions: WorldDimensions,
  plot: Plot
): boolean {
  if (position.x < 0 || position.y < 0) return false;
  if (position.x + dimensions.width > plot.width) return false;
  if (position.y + dimensions.height > plot.length) return false;
  return true;
}
