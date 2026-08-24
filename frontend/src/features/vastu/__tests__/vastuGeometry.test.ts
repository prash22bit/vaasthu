/**
 * vastuGeometry.test.ts
 * Tests for all canonical geometry functions across all 8 compass directions.
 */

import { describe, it, expect } from 'vitest';
import {
  worldVectorToCompassDirection,
  normalizePlotPoint,
  getZoneForNormalizedPoint,
  getZoneForWorldPoint,
  getEntityBounds,
  getEntityCenter,
  getBoundaryPosition,
  getWallSide,
  DEFAULT_ZONE_CONFIG,
} from '../vastuGeometry';
import type { Plot, DesignEntity, WallEntity } from '@vastuplan/shared';

const EAST_FACING_PLOT: Plot = {
  shape: 'rectangle',
  width: 40,
  length: 60,
  unit: 'feet',
  facing: 'east',
  orientationDegrees: 90,
};

// ── worldVectorToCompassDirection ─────────────────────────────────────────────

describe('worldVectorToCompassDirection — canonical direction function', () => {
  it('pure East vector → E', () => {
    expect(worldVectorToCompassDirection(1, 0)).toBe('E');
  });

  it('pure West vector → W', () => {
    expect(worldVectorToCompassDirection(-1, 0)).toBe('W');
  });

  it('pure North vector (negative Y) → N', () => {
    expect(worldVectorToCompassDirection(0, -1)).toBe('N');
  });

  it('pure South vector (positive Y) → S', () => {
    expect(worldVectorToCompassDirection(0, 1)).toBe('S');
  });

  it('NE diagonal → NE', () => {
    expect(worldVectorToCompassDirection(1, -1)).toBe('NE');
  });

  it('NW diagonal → NW', () => {
    expect(worldVectorToCompassDirection(-1, -1)).toBe('NW');
  });

  it('SE diagonal → SE', () => {
    expect(worldVectorToCompassDirection(1, 1)).toBe('SE');
  });

  it('SW diagonal → SW', () => {
    expect(worldVectorToCompassDirection(-1, 1)).toBe('SW');
  });

  it('zero vector → CENTER', () => {
    expect(worldVectorToCompassDirection(0, 0)).toBe('CENTER');
  });

  it('near-zero vector → CENTER', () => {
    expect(worldVectorToCompassDirection(1e-10, 1e-10)).toBe('CENTER');
  });

  // Verify compass bearing math precisely
  it('atan2(0, 1) = 0° (East) → 90° compass → E', () => {
    const result = worldVectorToCompassDirection(1, 0);
    expect(result).toBe('E');
  });

  it('atan2(-1, 0) = -90° (North) → 0° compass → N', () => {
    const result = worldVectorToCompassDirection(0, -1);
    expect(result).toBe('N');
  });
});

// ── normalizePlotPoint ────────────────────────────────────────────────────────

describe('normalizePlotPoint', () => {
  it('origin → (0, 0)', () => {
    const result = normalizePlotPoint({ x: 0, y: 0 }, EAST_FACING_PLOT);
    expect(result.nx).toBeCloseTo(0);
    expect(result.ny).toBeCloseTo(0);
  });

  it('plot center → (0.5, 0.5)', () => {
    const result = normalizePlotPoint({ x: 20, y: 30 }, EAST_FACING_PLOT);
    expect(result.nx).toBeCloseTo(0.5);
    expect(result.ny).toBeCloseTo(0.5);
  });

  it('SE corner → (1, 1)', () => {
    const result = normalizePlotPoint({ x: 40, y: 60 }, EAST_FACING_PLOT);
    expect(result.nx).toBeCloseTo(1);
    expect(result.ny).toBeCloseTo(1);
  });

  it('NE corner → (1, 0)', () => {
    const result = normalizePlotPoint({ x: 40, y: 0 }, EAST_FACING_PLOT);
    expect(result.nx).toBeCloseTo(1);
    expect(result.ny).toBeCloseTo(0);
  });

  it('NW corner → (0, 0)', () => {
    const result = normalizePlotPoint({ x: 0, y: 0 }, EAST_FACING_PLOT);
    expect(result.nx).toBeCloseTo(0);
    expect(result.ny).toBeCloseTo(0);
  });
});

// ── getZoneForNormalizedPoint ─────────────────────────────────────────────────

describe('getZoneForNormalizedPoint', () => {
  const config = DEFAULT_ZONE_CONFIG;

  it('center (0.5, 0.5) → CENTER', () => {
    expect(getZoneForNormalizedPoint(0.5, 0.5, config)).toBe('CENTER');
  });

  it('NW corner (0, 0) → NW', () => {
    expect(getZoneForNormalizedPoint(0, 0, config)).toBe('NW');
  });

  it('NE corner (1, 0) → NE', () => {
    expect(getZoneForNormalizedPoint(1, 0, config)).toBe('NE');
  });

  it('SW corner (0, 1) → SW', () => {
    expect(getZoneForNormalizedPoint(0, 1, config)).toBe('SW');
  });

  it('SE corner (1, 1) → SE', () => {
    expect(getZoneForNormalizedPoint(1, 1, config)).toBe('SE');
  });

  it('top center (0.5, 0.1) → N', () => {
    expect(getZoneForNormalizedPoint(0.5, 0.1, config)).toBe('N');
  });

  it('bottom center (0.5, 0.9) → S', () => {
    expect(getZoneForNormalizedPoint(0.5, 0.9, config)).toBe('S');
  });

  it('left center (0.1, 0.5) → W', () => {
    expect(getZoneForNormalizedPoint(0.1, 0.5, config)).toBe('W');
  });

  it('right center (0.9, 0.5) → E', () => {
    expect(getZoneForNormalizedPoint(0.9, 0.5, config)).toBe('E');
  });
});

// ── getZoneForWorldPoint ──────────────────────────────────────────────────────

describe('getZoneForWorldPoint', () => {
  it('SE corner of 40x60 plot → SE', () => {
    expect(getZoneForWorldPoint({ x: 38, y: 58 }, EAST_FACING_PLOT)).toBe('SE');
  });

  it('NE of 40x60 plot → NE', () => {
    expect(getZoneForWorldPoint({ x: 38, y: 2 }, EAST_FACING_PLOT)).toBe('NE');
  });

  it('Center of 40x60 plot → CENTER', () => {
    expect(getZoneForWorldPoint({ x: 20, y: 30 }, EAST_FACING_PLOT)).toBe('CENTER');
  });
});

// ── getEntityBounds ───────────────────────────────────────────────────────────

describe('getEntityBounds', () => {
  const roomEntity: DesignEntity = {
    id: 'room-1', type: 'room',
    position: { x: 10, y: 10 },
    dimensions: { width: 15, height: 20 },
    rotation: 0, properties: { name: 'Living Room', roomType: 'living-room' },
    floorIndex: 0, locked: false, visible: true,
  };

  it('returns correct bounds for a room', () => {
    const bounds = getEntityBounds(roomEntity);
    expect(bounds.minX).toBe(10);
    expect(bounds.minY).toBe(10);
    expect(bounds.maxX).toBe(25);
    expect(bounds.maxY).toBe(30);
  });

  it('returns correct center for a room', () => {
    const bounds = getEntityBounds(roomEntity);
    expect(bounds.center.x).toBe(17.5);
    expect(bounds.center.y).toBe(20);
  });

  const wallEntity: WallEntity = {
    id: 'wall-1', type: 'wall',
    position: { x: 0, y: 0 },
    dimensions: { width: 0, height: 0 },
    rotation: 0,
    properties: { startX: 5, startY: 10, endX: 35, endY: 10, thickness: 0.5 },
    floorIndex: 0, locked: false, visible: true,
  };

  it('uses startX/endX for wall bounds', () => {
    const bounds = getEntityBounds(wallEntity);
    expect(bounds.minX).toBe(5);
    expect(bounds.maxX).toBe(35);
    expect(bounds.center.x).toBe(20);
    expect(bounds.center.y).toBe(10);
  });
});

// ── getEntityCenter ───────────────────────────────────────────────────────────

describe('getEntityCenter', () => {
  it('center of a 20×20 room at (0,0) is (10, 10)', () => {
    const entity: DesignEntity = {
      id: 'r1', type: 'room',
      position: { x: 0, y: 0 },
      dimensions: { width: 20, height: 20 },
      rotation: 0, properties: { name: 'Test', roomType: 'bedroom' },
      floorIndex: 0, locked: false, visible: true,
    };
    const center = getEntityCenter(entity);
    expect(center.x).toBe(10);
    expect(center.y).toBe(10);
  });
});

// ── getBoundaryPosition ───────────────────────────────────────────────────────

describe('getBoundaryPosition — pada architecture preparation', () => {
  const plot = EAST_FACING_PLOT;

  const makeDoor = (x: number, y: number): DesignEntity => ({
    id: 'd1', type: 'door',
    position: { x, y },
    dimensions: { width: 3, height: 7 },
    rotation: 0, properties: { hostWallId: 'w1', offsetAlongWall: 0, doorType: 'single',
      swingDirection: 'left', swingOrientation: 'inward', width: 3, height: 7 },
    floorIndex: 0, locked: false, visible: true,
  });

  it('door on East boundary → side=E', () => {
    const door = makeDoor(39, 30); // near x=40 (East boundary)
    const bp = getBoundaryPosition(door, plot);
    expect(bp?.side).toBe('E');
  });

  it('door on North boundary → side=N', () => {
    const door = makeDoor(20, 1); // near y=0 (North boundary)
    const bp = getBoundaryPosition(door, plot);
    expect(bp?.side).toBe('N');
  });

  it('door in center → null (not on boundary)', () => {
    const door = makeDoor(20, 30);
    const bp = getBoundaryPosition(door, plot);
    expect(bp).toBeNull();
  });

  it('pada is computed (1-9)', () => {
    const door = makeDoor(0, 30); // West boundary, middle
    const bp = getBoundaryPosition(door, plot);
    expect(bp?.pada).toBeGreaterThanOrEqual(1);
    expect(bp?.pada).toBeLessThanOrEqual(9);
  });
});
