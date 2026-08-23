import { describe, it, expect } from 'vitest';
import {
  distanceBetweenPoints,
  calculateAngle,
  calculateRectangleArea,
  snapPointToGrid,
  snapAngle,
  projectPointOntoLine,
  alignEntities,
} from '../geometry';
import { getSnapPoint } from '../snapping';
import type { WallEntity, RoomEntity, DesignEntity } from '@vastuplan/shared';

describe('CAD Geometry Utilities', () => {
  it('calculates distance between points correctly', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };
    expect(distanceBetweenPoints(p1, p2)).toBe(5);
  });

  it('calculates angle in degrees correctly', () => {
    const origin = { x: 0, y: 0 };
    expect(calculateAngle(origin, { x: 10, y: 0 })).toBe(0);
    expect(calculateAngle(origin, { x: 0, y: 10 })).toBe(90);
    expect(calculateAngle(origin, { x: -10, y: 0 })).toBe(180);
    expect(calculateAngle(origin, { x: 0, y: -10 })).toBe(270);
  });

  it('calculates rectangle area correctly', () => {
    expect(calculateRectangleArea(14, 16)).toBe(224);
  });

  it('snaps angles to nearest 45 degrees within threshold', () => {
    expect(snapAngle(88, 45, 5)).toBe(90);
    expect(snapAngle(2, 45, 5)).toBe(0);
    expect(snapAngle(358, 45, 5)).toBe(0);
    expect(snapAngle(25, 45, 5)).toBe(25); // outside threshold
  });

  it('projects point onto line segment', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 10, y: 0 };
    const point = { x: 5, y: 3 };
    const proj = projectPointOntoLine(point, p1, p2);
    expect(proj.point.x).toBe(5);
    expect(proj.point.y).toBe(0);
    expect(proj.distance).toBe(3);
  });

  it('snaps points to grid', () => {
    const point = { x: 12.83, y: 14.12 };
    const snapped = snapPointToGrid(point, 1);
    expect(snapped.x).toBe(13);
    expect(snapped.y).toBe(14);
  });

  it('aligns entities correctly', () => {
    const entities = [
      { position: { x: 10, y: 10 }, dimensions: { width: 10, height: 10 } },
      { position: { x: 25, y: 20 }, dimensions: { width: 5, height: 5 } },
    ];
    const alignedLeft = alignEntities(entities, 'left');
    expect(alignedLeft[0].position.x).toBe(10);
    expect(alignedLeft[1].position.x).toBe(10);
  });
});

describe('Snapping Engine Priority', () => {
  const wall: WallEntity = {
    id: 'wall1',
    type: 'wall',
    position: { x: 0, y: 0 },
    dimensions: { width: 20, height: 0.375 },
    rotation: 0,
    floorIndex: 0,
    locked: false,
    visible: true,
    properties: {
      startX: 0,
      startY: 0,
      endX: 20,
      endY: 0,
      thickness: 0.375,
    },
  };

  it('prioritizes endpoint snap over grid snap', () => {
    const cursor = { x: 0.2, y: 0.1 }; // close to endpoint (0,0)
    const result = getSnapPoint(cursor, [wall as unknown as DesignEntity], { threshold: 1.0, cellSize: 1 });
    expect(result.type).toBe('endpoint');
    expect(result.point).toEqual({ x: 0, y: 0 });
  });

  it('prioritizes midpoint snap over wall line snap', () => {
    const cursor = { x: 10.1, y: 0.1 }; // close to midpoint (10,0)
    const result = getSnapPoint(cursor, [wall as unknown as DesignEntity], { threshold: 1.0, cellSize: 1 });
    expect(result.type).toBe('midpoint');
    expect(result.point).toEqual({ x: 10, y: 0 });
  });

  it('falls back to grid snap when no entity is near', () => {
    const cursor = { x: 4.8, y: 5.2 };
    const result = getSnapPoint(cursor, [wall as unknown as DesignEntity], { threshold: 0.5, cellSize: 1 });
    expect(result.type).toBe('grid');
    expect(result.point).toEqual({ x: 5, y: 5 });
  });
});
