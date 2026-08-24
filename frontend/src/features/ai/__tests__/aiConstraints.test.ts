import { describe, it, expect } from 'vitest';
import { validateProposal } from '../aiCommandValidator';
import type { Project, AIProposal, RoomEntity } from '@vastuplan/shared';

function createProjectWithRooms(): Project {
  const kitchen: RoomEntity = {
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

  const bedroom: RoomEntity = {
    id: 'room_master',
    type: 'room',
    position: { x: 20, y: 20 },
    dimensions: { width: 14, height: 16 },
    rotation: 0,
    properties: { name: 'Master Bedroom', roomType: 'master-bedroom' },
    floorIndex: 0,
    locked: false,
    visible: true,
  };

  return {
    id: 'proj_constraints',
    name: 'Constraints Test',
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
        entities: [kitchen, bedroom],
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

describe('AI User Constraints Enforcement', () => {
  it('rejects proposals that violate explicit user negative constraints', () => {
    const project = createProjectWithRooms();

    // User explicitly says: "Don't move kitchen"
    const userConstraints = ['Don\'t move kitchen'];

    const violatingProposal: AIProposal = {
      id: 'p_violating',
      title: 'Move Kitchen to SE',
      explanation: 'Optimizing kitchen placement',
      commands: [
        {
          id: 'c1',
          action: 'move_entity',
          entityId: 'room_kitchen',
          entityType: 'room',
          params: { x: 28, y: 45 },
          description: 'Move kitchen to 28,45',
        },
      ],
      validationErrors: [],
      warnings: [],
      status: 'pending-validation',
      createdAt: new Date().toISOString(),
    };

    const res = validateProposal(violatingProposal, project, 0, userConstraints);
    expect(res.isValid).toBe(false);
    expect(res.errors[0].reason).toContain('violates user constraint');

    // A proposal modifying the unconstrained master bedroom should pass
    const allowedProposal: AIProposal = {
      id: 'p_allowed',
      title: 'Resize Master Bedroom',
      explanation: 'Making bedroom larger',
      commands: [
        {
          id: 'c1',
          action: 'resize_entity',
          entityId: 'room_master',
          entityType: 'room',
          params: { width: 16, height: 18 },
          description: 'Resize Master Bedroom',
        },
      ],
      validationErrors: [],
      warnings: [],
      status: 'pending-validation',
      createdAt: new Date().toISOString(),
    };

    const res2 = validateProposal(allowedProposal, project, 0, userConstraints);
    expect(res2.isValid).toBe(true);
  });
});
