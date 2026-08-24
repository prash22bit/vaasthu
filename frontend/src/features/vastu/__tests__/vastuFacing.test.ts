/**
 * vastuFacing.test.ts
 * Tests for facing orientation handling and entrance rule behavior.
 */
import { describe, it, expect } from 'vitest';
import { analyzeVastu } from '../vastuEngine';
import type { Project, DoorEntity } from '@vastuplan/shared';

const createProjectWithFacing = (facing: 'east' | 'west' | 'north' | 'south', doorX: number, doorY: number): Project => ({
  id: `test-${facing}`,
  name: `Facing Test ${facing}`,
  plot: {
    shape: 'rectangle', width: 40, length: 60,
    unit: 'feet', facing, orientationDegrees: facing === 'east' ? 90 : facing === 'west' ? 270 : facing === 'north' ? 0 : 180,
  },
  floors: [
    {
      id: 'f1', name: 'Ground Floor', level: 0, floorHeight: 10,
      entities: [
        {
          id: 'main-door', type: 'door', position: { x: doorX, y: doorY },
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
  settings: {
    grid: { visible: true, cellSize: 1, snapToGrid: true },
    defaultUnit: 'feet', showDimensions: true, showCompass: true,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('Facing Orientation and Entrance Rules', () => {
  it('Door at East boundary (x=39, y=30) on East-facing plot → preferred entrance', () => {
    const proj = createProjectWithFacing('east', 39, 30);
    const analysis = analyzeVastu(proj);
    const entranceResult = analysis.ruleResults.find((r) => r.ruleId === 'entrance-preferred-direction');
    expect(entranceResult?.status).toBe('preferred');
    expect(entranceResult?.currentZone).toBe('E');
  });

  it('Door at South boundary (x=20, y=59) on West-facing plot → violation entrance', () => {
    const proj = createProjectWithFacing('west', 20, 59);
    const analysis = analyzeVastu(proj);
    const entranceResult = analysis.ruleResults.find((r) => r.ruleId === 'entrance-preferred-direction');
    expect(entranceResult?.status).toBe('violation');
    expect(entranceResult?.currentZone).toBe('S');
  });
});
