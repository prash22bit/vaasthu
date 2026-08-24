import { describe, it, expect, beforeEach } from 'vitest';
import { executeProposalAtomically } from '../aiProposalExecutor';
import { useProjectStore } from '../../../stores/projectStore';
import { useHistoryStore } from '../../../stores/historyStore';
import type { Project, AIProposal, RoomEntity } from '@vastuplan/shared';

function createInitialProject(): Project {
  const room1: RoomEntity = {
    id: 'room_living',
    type: 'room',
    position: { x: 5, y: 5 },
    dimensions: { width: 15, height: 20 },
    rotation: 0,
    properties: { name: 'Living Room', roomType: 'living-room' },
    floorIndex: 0,
    locked: false,
    visible: true,
  };

  const room2: RoomEntity = {
    id: 'room_kitchen',
    type: 'room',
    position: { x: 25, y: 5 },
    dimensions: { width: 10, height: 10 },
    rotation: 0,
    properties: { name: 'Kitchen', roomType: 'kitchen' },
    floorIndex: 0,
    locked: false,
    visible: true,
  };

  return {
    id: 'proj_atomicity',
    name: 'Atomicity Test',
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
        entities: [room1, room2],
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

describe('AI Proposal Atomicity', () => {
  beforeEach(() => {
    useProjectStore.setState({
      currentProject: createInitialProject(),
      saveStatus: 'saved',
    });
    useHistoryStore.getState().clear();
  });

  it('aborts all changes when command 4 of 5 fails validation, leaving project identical', async () => {
    const initialProjectState = JSON.stringify(useProjectStore.getState().currentProject);

    const proposalWithFailingCmd4: AIProposal = {
      id: 'p_failing',
      title: '5 Commands with 1 Failure',
      explanation: 'Commands 1-3 valid, 4 invalid, 5 valid',
      commands: [
        {
          id: 'c1',
          action: 'create_room',
          entityType: 'room',
          params: { name: 'Bedroom 1', roomType: 'bedroom', x: 2, y: 30, width: 10, height: 12 },
          description: 'Add Bedroom 1',
        },
        {
          id: 'c2',
          action: 'move_entity',
          entityId: 'room_kitchen',
          entityType: 'room',
          params: { x: 28, y: 40 },
          description: 'Move Kitchen to 28,40',
        },
        {
          id: 'c3',
          action: 'resize_entity',
          entityId: 'room_living',
          entityType: 'room',
          params: { width: 16, height: 22 },
          description: 'Resize Living Room',
        },
        {
          id: 'c4',
          action: 'move_entity',
          entityId: 'room_non_existent_404', // FAILS!
          entityType: 'room',
          params: { x: 10, y: 10 },
          description: 'Move non-existent room',
        },
        {
          id: 'c5',
          action: 'create_room',
          entityType: 'room',
          params: { name: 'Pooja', roomType: 'pooja-room', x: 28, y: 2, width: 6, height: 6 },
          description: 'Add Pooja Room',
        },
      ],
      validationErrors: [],
      warnings: [],
      status: 'pending-validation',
      createdAt: new Date().toISOString(),
    };

    const res = await executeProposalAtomically(proposalWithFailingCmd4, 0);

    // 1. Result should indicate failure
    expect(res.success).toBe(false);
    expect(res.appliedCount).toBe(0);

    // 2. Project state must be EXACTLY identical to before
    const finalProjectState = JSON.stringify(useProjectStore.getState().currentProject);
    expect(finalProjectState).toEqual(initialProjectState);

    // 3. No history actions created
    expect(useHistoryStore.getState().past).toHaveLength(0);
  });
});
