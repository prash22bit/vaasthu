import { describe, it, expect } from 'vitest';
import {
  calculateHostedPosition,
  validateWallOccupancy,
  updateHostedEntitiesOnWallUpdate,
  updateHostedGatesOnSegmentUpdate,
  cleanOrphanedEntities,
} from '../architectural';
import type {
  WallEntity,
  DoorEntity,
  WindowEntity,
  GateEntity,
  CompoundWallEntity,
  DesignEntity,
} from '@vastuplan/shared';

describe('Architectural Relationship Utilities', () => {
  const sampleWall: WallEntity = {
    id: 'wall_1',
    type: 'wall',
    position: { x: 0, y: 0 },
    rotation: 0,
    dimensions: { width: 20, height: 0.5 },
    floorIndex: 0,
    locked: false,
    visible: true,
    properties: {
      startX: 0,
      startY: 0,
      endX: 20,
      endY: 0,
      thickness: 0.5,
    },
  };

  const sampleDoor: DoorEntity = {
    id: 'door_1',
    type: 'door',
    position: { x: 5, y: 0 },
    rotation: 0,
    dimensions: { width: 3, height: 0.5 },
    floorIndex: 0,
    locked: false,
    visible: true,
    properties: {
      hostWallId: 'wall_1',
      offsetAlongWall: 5,
      doorType: 'single',
      swingDirection: 'left',
      swingOrientation: 'inward',
      width: 3,
      height: 7,
    },
  };

  const sampleWindow: WindowEntity = {
    id: 'window_1',
    type: 'window',
    position: { x: 12, y: 0 },
    rotation: 0,
    dimensions: { width: 4, height: 0.5 },
    floorIndex: 0,
    locked: false,
    visible: true,
    properties: {
      hostWallId: 'wall_1',
      offsetAlongWall: 12,
      windowType: 'sliding',
      width: 4,
      height: 4,
    },
  };

  it('calculates hosted position along wall accurately', () => {
    const res = calculateHostedPosition(sampleWall.properties, 5);
    expect(res.position.x).toBeCloseTo(5);
    expect(res.position.y).toBeCloseTo(0);
    expect(res.rotation).toBeCloseTo(0);
    expect(res.wallLength).toBeCloseTo(20);
  });

  it('validates wall occupancy and boundary bounds', () => {
    // Valid placement (offset 0, width 3 on 20ft wall)
    const v1 = validateWallOccupancy(sampleWall.properties, [], 0, 3);
    expect(v1.valid).toBe(true);

    // Invalid placement (exceeds wall length: offset 18, width 3 = 21 > 20)
    const v2 = validateWallOccupancy(sampleWall.properties, [], 18, 3);
    expect(v2.valid).toBe(false);

    // Overlap validation (door is at 5..8, new window at 7..11)
    const existing = [
      { id: 'door_1', properties: { offsetAlongWall: 5, width: 3 } },
    ];
    const v3 = validateWallOccupancy(sampleWall.properties, existing, 7, 4);
    expect(v3.valid).toBe(false);

    // Non-overlapping placement (window at 10..14)
    const v4 = validateWallOccupancy(sampleWall.properties, existing, 10, 4);
    expect(v4.valid).toBe(true);
  });

  it('synchronizes hosted entity positions when host wall moves', () => {
    const movedWall: WallEntity = {
      ...sampleWall,
      properties: {
        ...sampleWall.properties,
        startX: 10,
        startY: 10,
        endX: 30,
        endY: 10,
      },
    };

    const updated = updateHostedEntitiesOnWallUpdate(movedWall, [
      movedWall as unknown as DesignEntity,
      sampleDoor as unknown as DesignEntity,
      sampleWindow as unknown as DesignEntity,
    ]);

    const updatedDoor = updated.find((e) => e.id === 'door_1') as DoorEntity;
    expect(updatedDoor.position.x).toBeCloseTo(15);
    expect(updatedDoor.position.y).toBeCloseTo(10);
  });

  it('cleans orphaned doors and windows when host wall is deleted', () => {
    const entities = [
      sampleDoor as unknown as DesignEntity,
      sampleWindow as unknown as DesignEntity,
    ];
    const cleaned = cleanOrphanedEntities(entities);
    expect(cleaned).toHaveLength(0);
  });

  it('handles compound wall segment deletion vs entity deletion correctly', () => {
    const compoundWall: CompoundWallEntity = {
      id: 'cw_1',
      type: 'compound-wall',
      position: { x: 0, y: 0 },
      rotation: 0,
      dimensions: { width: 40, height: 60 },
      floorIndex: 0,
      locked: false,
      visible: true,
      properties: {
        thickness: 0.5,
        segments: [
          { id: 'seg_1', startX: 0, startY: 0, endX: 40, endY: 0 },
          { id: 'seg_2', startX: 40, startY: 0, endX: 40, endY: 60 },
        ],
      },
    };

    const gate1: GateEntity = {
      id: 'gate_1',
      type: 'gate',
      position: { x: 10, y: 0 },
      rotation: 0,
      dimensions: { width: 8, height: 0.5 },
      floorIndex: 0,
      locked: false,
      visible: true,
      properties: {
        hostCompoundWallId: 'cw_1',
        hostSegmentId: 'seg_1',
        offsetAlongWall: 10,
        gateType: 'double',
        width: 8,
      },
    };

    const gate2: GateEntity = {
      id: 'gate_2',
      type: 'gate',
      position: { x: 40, y: 20 },
      rotation: 90,
      dimensions: { width: 6, height: 0.5 },
      floorIndex: 0,
      locked: false,
      visible: true,
      properties: {
        hostCompoundWallId: 'cw_1',
        hostSegmentId: 'seg_2',
        offsetAlongWall: 20,
        gateType: 'sliding',
        width: 6,
      },
    };

    // Case A: Deleting seg_2 removes only seg_2 and gate2
    const updatedCW: CompoundWallEntity = {
      ...compoundWall,
      properties: {
        ...compoundWall.properties,
        segments: [compoundWall.properties.segments[0]], // seg_1 only
      },
    };

    const cleanedAfterSeg2Delete = cleanOrphanedEntities([
      updatedCW as unknown as DesignEntity,
      gate1 as unknown as DesignEntity,
      gate2 as unknown as DesignEntity,
    ]);

    expect(cleanedAfterSeg2Delete.map((e) => e.id)).toContain('gate_1');
    expect(cleanedAfterSeg2Delete.map((e) => e.id)).not.toContain('gate_2');

    // Case B: Deleting entire compound wall removes all gates
    const cleanedAfterCWDelete = cleanOrphanedEntities([
      gate1 as unknown as DesignEntity,
      gate2 as unknown as DesignEntity,
    ]);
    expect(cleanedAfterCWDelete).toHaveLength(0);
  });
});
