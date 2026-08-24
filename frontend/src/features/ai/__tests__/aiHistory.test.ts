import { describe, it, expect, beforeEach } from 'vitest';
import { executeProposalAtomically } from '../aiProposalExecutor';
import { useProjectStore } from '../../../stores/projectStore';
import { useHistoryStore } from '../../../stores/historyStore';
import type { Project, AIProposal, RoomEntity } from '@vastuplan/shared';

function createMockProject(): Project {
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

  return {
    id: 'proj_history_test',
    name: 'History Test Project',
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
        entities: [room1],
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

describe('AI Proposal History Integration', () => {
  beforeEach(() => {
    useProjectStore.setState({
      currentProject: createMockProject(),
      saveStatus: 'saved',
    });
    useHistoryStore.getState().clear();
  });

  it('records exactly ONE history entry for multi-command proposals and supports single-step undo/redo', async () => {
    const proposal: AIProposal = {
      id: 'p_history',
      title: 'Move and Add Rooms',
      explanation: 'Move Living Room and add Kitchen',
      commands: [
        {
          id: 'c1',
          action: 'move_entity',
          entityId: 'room_living',
          entityType: 'room',
          params: { x: 10, y: 15 },
          description: 'Move living room',
        },
        {
          id: 'c2',
          action: 'create_room',
          entityType: 'room',
          params: { name: 'Kitchen', roomType: 'kitchen', x: 28, y: 40, width: 10, height: 10 },
          description: 'Add kitchen',
        },
      ],
      validationErrors: [],
      warnings: [],
      status: 'pending-validation',
      createdAt: new Date().toISOString(),
    };

    const res = await executeProposalAtomically(proposal, 0);
    expect(res.success).toBe(true);

    // 1. Exactly ONE history entry created
    const historyPast = useHistoryStore.getState().past;
    expect(historyPast).toHaveLength(1);
    expect(historyPast[0].type).toBe('AI_PROPOSAL');

    // 2. State after proposal: 2 rooms, living at 10,15
    const floorAfter = useProjectStore.getState().currentProject!.floors[0];
    expect(floorAfter.entities).toHaveLength(2);
    expect(floorAfter.entities.find((e) => e.id === 'room_living')?.position).toEqual({ x: 10, y: 15 });

    // 3. Undo: returns previous action
    const undoneAction = useHistoryStore.getState().undo();
    expect(undoneAction).not.toBeNull();
    expect(undoneAction?.type).toBe('AI_PROPOSAL');

    // Apply undo snapshot to projectStore
    const beforeState = undoneAction?.before as { floorIndex: number; entities: any[] };
    useProjectStore.setState((s) => {
      if (s.currentProject) {
        s.currentProject.floors[beforeState.floorIndex].entities = beforeState.entities;
      }
    });

    const floorUndone = useProjectStore.getState().currentProject!.floors[0];
    expect(floorUndone.entities).toHaveLength(1);
    expect(floorUndone.entities[0].position).toEqual({ x: 5, y: 5 });

    // 4. Redo: re-applies the proposal
    const redoneAction = useHistoryStore.getState().redo();
    expect(redoneAction).not.toBeNull();

    const afterState = redoneAction?.after as { floorIndex: number; entities: any[] };
    useProjectStore.setState((s) => {
      if (s.currentProject) {
        s.currentProject.floors[afterState.floorIndex].entities = afterState.entities;
      }
    });

    const floorRedone = useProjectStore.getState().currentProject!.floors[0];
    expect(floorRedone.entities).toHaveLength(2);
    expect(floorRedone.entities.find((e) => e.id === 'room_living')?.position).toEqual({ x: 10, y: 15 });
  });
});
