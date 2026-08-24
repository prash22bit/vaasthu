/**
 * vastuNonDestructive.test.ts
 * Verifies that analyzeVastu() is pure and completely read-only.
 */
import { describe, it, expect } from 'vitest';
import { analyzeVastu } from '../vastuEngine';
import type { Project, RoomEntity } from '@vastuplan/shared';

describe('Vastu Analysis Non-Destructiveness', () => {
  it('analyzeVastu does not mutate the project object or its entities', () => {
    const originalRoom: RoomEntity = {
      id: 'r1', type: 'room', position: { x: 10, y: 10 },
      dimensions: { width: 15, height: 15 }, rotation: 0,
      properties: { name: 'Kitchen', roomType: 'kitchen' },
      floorIndex: 0, locked: false, visible: true,
    };

    const originalProject: Project = {
      id: 'proj-1', name: 'ReadOnly Test',
      plot: { shape: 'rectangle', width: 40, length: 60, unit: 'feet', facing: 'east', orientationDegrees: 90 },
      floors: [{ id: 'f1', name: 'Ground Floor', level: 0, floorHeight: 10, entities: [originalRoom] }],
      settings: { grid: { visible: true, cellSize: 1, snapToGrid: true }, defaultUnit: 'feet', showDimensions: true, showCompass: true },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const stringifiedBefore = JSON.stringify(originalProject);
    const analysis = analyzeVastu(originalProject);
    const stringifiedAfter = JSON.stringify(originalProject);

    expect(stringifiedBefore).toBe(stringifiedAfter);
    expect(analysis).toBeDefined();
    expect(analysis.overallScore).toBeDefined();
  });
});
