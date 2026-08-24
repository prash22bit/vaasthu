import { describe, it, expect } from 'vitest';
import { validateProposal } from '../aiCommandValidator';
import type { Project, AIProposal, RoomEntity, WallEntity } from '@vastuplan/shared';

function createMockProject(): Project {
  const room1: RoomEntity = {
    id: 'room_kitchen',
    type: 'room',
    position: { x: 5, y: 5 },
    dimensions: { width: 10, height: 10 },
    rotation: 0,
    properties: { name: 'Kitchen', roomType: 'kitchen' },
    floorIndex: 0,
    locked: false,
    visible: true,
  };

  const wall1: WallEntity = {
    id: 'wall_north',
    type: 'wall',
    position: { x: 0, y: 0 },
    dimensions: { width: 40, height: 0 },
    rotation: 0,
    properties: { startX: 0, startY: 0, endX: 40, endY: 0, thickness: 0.375 },
    floorIndex: 0,
    locked: false,
    visible: true,
  };

  return {
    id: 'proj_test',
    name: 'Test Project',
    plot: {
      shape: 'rectangle',
      width: 40,
      length: 60,
      unit: 'feet',
      facing: 'east',
      orientationDegrees: 90,
    },
    floors: [
      {
        id: 'floor_0',
        name: 'Ground Floor',
        level: 0,
        entities: [room1, wall1],
        floorHeight: 10,
      },
    ],
    settings: {
      grid: { visible: true, cellSize: 1, snapToGrid: true },
      defaultUnit: 'feet',
      showDimensions: true,
      showCompass: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('AI Command Validator', () => {
  it('validates a correct move_entity command', () => {
    const project = createMockProject();
    const proposal: AIProposal = {
      id: 'p1',
      title: 'Move Kitchen',
      explanation: 'Moving kitchen to SE',
      commands: [
        {
          id: 'c1',
          action: 'move_entity',
          entityId: 'room_kitchen',
          entityType: 'room',
          params: { x: 25, y: 45 },
          description: 'Move kitchen to 25, 45',
        },
      ],
      validationErrors: [],
      warnings: [],
      status: 'pending-validation',
      createdAt: new Date().toISOString(),
    };

    const res = validateProposal(proposal, project, 0);
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('rejects move_entity when entity is placed outside plot bounds', () => {
    const project = createMockProject();
    const proposal: AIProposal = {
      id: 'p2',
      title: 'Move Outside Plot',
      explanation: 'Moving kitchen past East boundary',
      commands: [
        {
          id: 'c1',
          action: 'move_entity',
          entityId: 'room_kitchen',
          entityType: 'room',
          params: { x: 35, y: 10 }, // 35 + 10 width = 45 > plot width 40
          description: 'Move kitchen past East boundary',
        },
      ],
      validationErrors: [],
      warnings: [],
      status: 'pending-validation',
      createdAt: new Date().toISOString(),
    };

    const res = validateProposal(proposal, project, 0);
    expect(res.isValid).toBe(false);
    expect(res.errors[0].reason).toContain('outside the plot boundary');
  });

  it('rejects commands referencing non-existent entity IDs', () => {
    const project = createMockProject();
    const proposal: AIProposal = {
      id: 'p3',
      title: 'Move Ghost Room',
      explanation: 'Moving non-existent room',
      commands: [
        {
          id: 'c1',
          action: 'move_entity',
          entityId: 'room_ghost_999',
          entityType: 'room',
          params: { x: 10, y: 10 },
          description: 'Move ghost room',
        },
      ],
      validationErrors: [],
      warnings: [],
      status: 'pending-validation',
      createdAt: new Date().toISOString(),
    };

    const res = validateProposal(proposal, project, 0);
    expect(res.isValid).toBe(false);
    expect(res.errors[0].reason).toContain('does not exist');
  });

  it('validates door creation on existing host wall with occupancy check', () => {
    const project = createMockProject();
    const validDoorProposal: AIProposal = {
      id: 'p4',
      title: 'Add Door',
      explanation: 'Add 3ft door on north wall',
      commands: [
        {
          id: 'c1',
          action: 'create_door',
          entityType: 'door',
          params: {
            hostWallId: 'wall_north',
            offsetAlongWall: 10,
            width: 3,
            doorType: 'single',
          },
          description: 'Add 3ft single door at offset 10',
        },
      ],
      validationErrors: [],
      warnings: [],
      status: 'pending-validation',
      createdAt: new Date().toISOString(),
    };

    const res1 = validateProposal(validDoorProposal, project, 0);
    expect(res1.isValid).toBe(true);

    // Door exceeding wall length (wall length is 40)
    const invalidDoorProposal: AIProposal = {
      id: 'p5',
      title: 'Add Door Overflow',
      explanation: 'Door hangs off edge of wall',
      commands: [
        {
          id: 'c1',
          action: 'create_door',
          entityType: 'door',
          params: {
            hostWallId: 'wall_north',
            offsetAlongWall: 38,
            width: 4, // 38 + 4 = 42 > 40
          },
          description: 'Door exceeds wall length',
        },
      ],
      validationErrors: [],
      warnings: [],
      status: 'pending-validation',
      createdAt: new Date().toISOString(),
    };

    const res2 = validateProposal(invalidDoorProposal, project, 0);
    expect(res2.isValid).toBe(false);
    expect(res2.errors[0].reason).toContain('does not fit on wall');
  });

  it('rejects door creation with non-existent hostWallId', () => {
    const project = createMockProject();
    const proposal: AIProposal = {
      id: 'p6',
      title: 'Add Door on Missing Wall',
      explanation: 'Wall does not exist',
      commands: [
        {
          id: 'c1',
          action: 'create_door',
          entityType: 'door',
          params: {
            hostWallId: 'wall_imaginary',
            offsetAlongWall: 5,
            width: 3,
          },
          description: 'Door on imaginary wall',
        },
      ],
      validationErrors: [],
      warnings: [],
      status: 'pending-validation',
      createdAt: new Date().toISOString(),
    };

    const res = validateProposal(proposal, project, 0);
    expect(res.isValid).toBe(false);
    expect(res.errors[0].reason).toContain('does not exist or is not a structural wall');
  });

  it('validates resize_entity with positive dimensions within plot', () => {
    const project = createMockProject();
    const proposal: AIProposal = {
      id: 'p7',
      title: 'Resize Kitchen',
      explanation: 'Resize kitchen to 12x15',
      commands: [
        {
          id: 'c1',
          action: 'resize_entity',
          entityId: 'room_kitchen',
          entityType: 'room',
          params: { width: 12, height: 15 },
          description: 'Resize kitchen to 12x15',
        },
      ],
      validationErrors: [],
      warnings: [],
      status: 'pending-validation',
      createdAt: new Date().toISOString(),
    };

    const res = validateProposal(proposal, project, 0);
    expect(res.isValid).toBe(true);
  });

  it('rejects resize_entity with non-positive dimensions', () => {
    const project = createMockProject();
    const proposal: AIProposal = {
      id: 'p8',
      title: 'Resize Kitchen Negative',
      explanation: 'Negative width',
      commands: [
        {
          id: 'c1',
          action: 'resize_entity',
          entityId: 'room_kitchen',
          entityType: 'room',
          params: { width: -5, height: 10 },
          description: 'Invalid dimensions',
        },
      ],
      validationErrors: [],
      warnings: [],
      status: 'pending-validation',
      createdAt: new Date().toISOString(),
    };

    const res = validateProposal(proposal, project, 0);
    expect(res.isValid).toBe(false);
    expect(res.errors[0].reason).toContain('must be positive numbers');
  });
});
