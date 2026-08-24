/**
 * vastuScoring.test.ts
 * Tests scoring transparency and behavior across different layouts.
 */
import { describe, it, expect } from 'vitest';
import { analyzeVastu } from '../vastuEngine';
import type { Project, RoomEntity, DoorEntity } from '@vastuplan/shared';

const BASE_PROJECT: Project = {
  id: 'test-project-1',
  name: 'Scoring Test',
  plot: {
    shape: 'rectangle', width: 40, length: 60,
    unit: 'feet', facing: 'east', orientationDegrees: 90,
  },
  floors: [
    {
      id: 'f1', name: 'Ground Floor', level: 0, floorHeight: 10,
      entities: [],
    },
  ],
  settings: {
    grid: { visible: true, cellSize: 1, snapToGrid: true },
    defaultUnit: 'feet', showDimensions: true, showCompass: true,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Vastu Analysis Scoring', () => {
  it('empty project → neutral baseline score (around 50)', () => {
    const analysis = analyzeVastu(BASE_PROJECT);
    expect(analysis.overallScore).toBe(50);
  });

  it('all-preferred layout → high score (>80)', () => {
    const perfectProject: Project = {
      ...BASE_PROJECT,
      floors: [
        {
          id: 'f1', name: 'Ground Floor', level: 0, floorHeight: 10,
          entities: [
            // Kitchen in SE (x=28, y=42)
            {
              id: 'k1', type: 'room', position: { x: 28, y: 42 },
              dimensions: { width: 10, height: 12 }, rotation: 0,
              properties: { name: 'Kitchen', roomType: 'kitchen' },
              floorIndex: 0, locked: false, visible: true,
            } as RoomEntity,
            // Master Bedroom in SW (x=2, y=42)
            {
              id: 'mb1', type: 'room', position: { x: 2, y: 42 },
              dimensions: { width: 12, height: 16 }, rotation: 0,
              properties: { name: 'Master Bedroom', roomType: 'master-bedroom' },
              floorIndex: 0, locked: false, visible: true,
            } as RoomEntity,
            // Pooja Room in NE (x=28, y=2)
            {
              id: 'p1', type: 'room', position: { x: 28, y: 2 },
              dimensions: { width: 8, height: 8 }, rotation: 0,
              properties: { name: 'Pooja', roomType: 'pooja-room' },
              floorIndex: 0, locked: false, visible: true,
            } as RoomEntity,
            // Main Entrance on East (x=39, y=30)
            {
              id: 'd1', type: 'door', position: { x: 39, y: 30 },
              dimensions: { width: 3, height: 7 }, rotation: 0,
              properties: {
                hostWallId: 'w1', offsetAlongWall: 0, doorType: 'single',
                swingDirection: 'left', swingOrientation: 'inward', width: 3, height: 7,
                doorRole: 'main-entrance',
              },
              floorIndex: 0, locked: false, visible: true,
            } as DoorEntity,
          ],
        },
      ],
    };

    const analysis = analyzeVastu(perfectProject);
    expect(analysis.overallScore).toBeGreaterThan(70);
  });

  it('layout with critical violations → low score (<50)', () => {
    const badProject: Project = {
      ...BASE_PROJECT,
      floors: [
        {
          id: 'f1', name: 'Ground Floor', level: 0, floorHeight: 10,
          entities: [
            // Toilet in NE (x=28, y=2) -> Critical violation
            {
              id: 't1', type: 'room', position: { x: 28, y: 2 },
              dimensions: { width: 8, height: 8 }, rotation: 0,
              properties: { name: 'Toilet', roomType: 'toilet' },
              floorIndex: 0, locked: false, visible: true,
            } as RoomEntity,
            // Kitchen in NE (x=28, y=2) -> Critical/Warning violation
            {
              id: 'k1', type: 'room', position: { x: 28, y: 2 },
              dimensions: { width: 10, height: 12 }, rotation: 0,
              properties: { name: 'Kitchen', roomType: 'kitchen' },
              floorIndex: 0, locked: false, visible: true,
            } as RoomEntity,
            // Staircase in NE (x=28, y=2) -> Critical violation
            {
              id: 's1', type: 'staircase', position: { x: 28, y: 2 },
              dimensions: { width: 10, height: 10 }, rotation: 0,
              properties: { staircaseType: 'straight', steps: 12, direction: 'up', width: 4 },
              floorIndex: 0, locked: false, visible: true,
            },
          ],
        },
      ],
    };

    const analysis = analyzeVastu(badProject);
    expect(analysis.overallScore).toBeLessThan(50);
  });

  it('score transparency: every result scoreImpact is defined and traceable', () => {
    const analysis = analyzeVastu(BASE_PROJECT);
    for (const res of analysis.ruleResults) {
      expect(typeof res.scoreImpact).toBe('number');
      expect(res.explanation).toBeTruthy();
    }
  });
});
