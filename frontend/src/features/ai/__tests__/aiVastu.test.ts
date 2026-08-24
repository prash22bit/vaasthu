import { describe, it, expect } from 'vitest';
import { generateProposalPreview } from '../aiProposalPreview';
import { executeProposalAtomically } from '../aiProposalExecutor';
import { analyzeVastu } from '../../vastu/vastuEngine';
import { useProjectStore } from '../../../stores/projectStore';
import type { Project, AIProposal, RoomEntity } from '@vastuplan/shared';

function createVastuProject(): Project {
  // SW zone on 40x60 plot: x ∈ [0, 13.3], y ∈ [40, 60]
  // Placing Kitchen in SW (x=2, y=45) causes a Vastu warning
  const swKitchen: RoomEntity = {
    id: 'room_kitchen_sw',
    type: 'room',
    position: { x: 2, y: 45 },
    dimensions: { width: 10, height: 10 },
    rotation: 0,
    properties: { name: 'Kitchen', roomType: 'kitchen' },
    floorIndex: 0,
    locked: false,
    visible: true,
  };

  return {
    id: 'proj_vastu_ai',
    name: 'Vastu AI Test',
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
        entities: [swKitchen],
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

describe('AI Vastu Integration', () => {
  it('calculates Vastu delta in preview and updates analysis after apply without mutating state during preview', async () => {
    const project = createVastuProject();
    useProjectStore.setState({ currentProject: project, saveStatus: 'saved' });

    // Initial analysis
    const initialAnalysis = analyzeVastu(project, 0);
    const initialScore = initialAnalysis.overallScore;

    // Propose moving Kitchen to SE (x=28, y=45) — Agni zone
    const proposal: AIProposal = {
      id: 'p_vastu_opt',
      title: 'Move Kitchen to SE',
      explanation: 'Move kitchen to preferred South-East zone',
      commands: [
        {
          id: 'c1',
          action: 'move_entity',
          entityId: 'room_kitchen_sw',
          entityType: 'room',
          params: { x: 28, y: 45 },
          description: 'Move kitchen to SE zone',
        },
      ],
      validationErrors: [],
      warnings: [],
      status: 'valid',
      createdAt: new Date().toISOString(),
    };

    // 1. Preview calculation
    const preview = generateProposalPreview(project, proposal, 0);

    // Current project remains SW
    expect(project.floors[0].entities[0].position).toEqual({ x: 2, y: 45 });
    // Preview Vastu score is computed
    expect(preview.currentVastuScore).toBe(initialScore);
    expect(preview.proposedVastuScore).toBeGreaterThanOrEqual(initialScore);
    expect(preview.vastuDelta).toBeGreaterThanOrEqual(0);

    // 2. Apply proposal
    const result = await executeProposalAtomically(proposal, 0);
    expect(result.success).toBe(true);

    // 3. Project updated to SE
    const updatedProject = useProjectStore.getState().currentProject!;
    expect(updatedProject.floors[0].entities[0].position).toEqual({ x: 28, y: 45 });

    // 4. Re-analysis on committed project matches proposed score
    const updatedAnalysis = analyzeVastu(updatedProject, 0);
    expect(updatedAnalysis.overallScore).toBe(preview.proposedVastuScore);
  });
});
