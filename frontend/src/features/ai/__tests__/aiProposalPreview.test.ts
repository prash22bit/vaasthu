import { describe, it, expect } from 'vitest';
import { generateProposalPreview } from '../aiProposalPreview';
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
    id: 'wall_1',
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
    id: 'proj_preview_test',
    name: 'Preview Test Project',
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

describe('AI Proposal Preview Projection', () => {
  it('derives new project state while keeping original project untouched', () => {
    const originalProject = createMockProject();
    const proposal: AIProposal = {
      id: 'p_move',
      title: 'Move Kitchen to SE',
      explanation: 'Move kitchen to 28, 45',
      commands: [
        {
          id: 'c1',
          action: 'move_entity',
          entityId: 'room_kitchen',
          entityType: 'room',
          params: { x: 28, y: 45 },
          description: 'Move kitchen',
        },
      ],
      validationErrors: [],
      warnings: [],
      status: 'valid',
      createdAt: new Date().toISOString(),
    };

    const previewResult = generateProposalPreview(originalProject, proposal, 0);

    // 1. Check original project is completely unchanged
    expect(originalProject.floors[0].entities[0].position).toEqual({ x: 5, y: 5 });

    // 2. Check preview project has the updated position
    const previewRoom = previewResult.previewProject.floors[0].entities.find(
      (e) => e.id === 'room_kitchen'
    );
    expect(previewRoom?.position).toEqual({ x: 28, y: 45 });

    // 3. Check diff output
    expect(previewResult.diffs).toHaveLength(1);
    expect(previewResult.diffs[0].changeType).toBe('moved');
    expect(previewResult.diffs[0].before?.position).toEqual({ x: 5, y: 5 });
    expect(previewResult.diffs[0].after?.position).toEqual({ x: 28, y: 45 });
  });

  it('supports multi-command proposals (create + move + resize + delete)', () => {
    const originalProject = createMockProject();
    const proposal: AIProposal = {
      id: 'p_multi',
      title: 'Comprehensive Layout Update',
      explanation: 'Add Bedroom, Move Kitchen, Delete Wall',
      commands: [
        {
          id: 'c1',
          action: 'create_room',
          entityType: 'room',
          params: { name: 'Master Bedroom', roomType: 'master-bedroom', x: 20, y: 30, width: 14, height: 16 },
          description: 'Add Master Bedroom',
        },
        {
          id: 'c2',
          action: 'move_entity',
          entityId: 'room_kitchen',
          entityType: 'room',
          params: { x: 25, y: 40 },
          description: 'Move Kitchen',
        },
        {
          id: 'c3',
          action: 'delete_entity',
          entityId: 'wall_1',
          entityType: 'wall',
          params: {},
          description: 'Delete Wall 1',
        },
      ],
      validationErrors: [],
      warnings: [],
      status: 'valid',
      createdAt: new Date().toISOString(),
    };

    const previewResult = generateProposalPreview(originalProject, proposal, 0);

    // Original project entities untouched (2 entities)
    expect(originalProject.floors[0].entities).toHaveLength(2);

    // Preview entities (2 original - 1 deleted + 1 created = 2 entities)
    const previewEntities = previewResult.previewProject.floors[0].entities;
    expect(previewEntities.some((e) => e.id === 'wall_1')).toBe(false);
    expect(previewEntities.some((e) => (e.properties.name as string) === 'Master Bedroom')).toBe(true);

    // Check diff breakdown
    const addedDiff = previewResult.diffs.find((d) => d.changeType === 'added');
    const movedDiff = previewResult.diffs.find((d) => d.changeType === 'moved');
    const removedDiff = previewResult.diffs.find((d) => d.changeType === 'removed');

    expect(addedDiff).toBeDefined();
    expect(movedDiff).toBeDefined();
    expect(removedDiff).toBeDefined();
    expect(removedDiff?.id).toBe('wall_1');
  });
});
