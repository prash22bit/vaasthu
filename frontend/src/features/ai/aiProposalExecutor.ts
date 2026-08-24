// =============================================================================
// VastuPlan — AI Proposal Atomic Executor
//
// Applies an approved, validated AI proposal as a single ATOMIC action.
//
// GUARANTEES:
//   1. All commands succeed or NONE are applied (all-or-nothing atomicity)
//   2. Exactly ONE history entry is created (Undo / Redo works in 1 step)
//   3. Auto-save is triggered
//   4. Vastu engine is re-evaluated or marked stale
// =============================================================================

import type {
  Project,
  AIProposal,
  DesignEntity,
  WallEntity,
  CompoundWallEntity,
} from '@vastuplan/shared';
import { useProjectStore } from '../../stores/projectStore';
import { useHistoryStore, createHistoryAction } from '../../stores/historyStore';
import { useVastuStore } from '../vastu/vastuStore';
import { validateProposal } from './aiCommandValidator';
import {
  calculateHostedPosition,
  updateHostedEntitiesOnWallUpdate,
  cleanOrphanedEntities,
} from '../../utils/architectural';

export interface ExecutionResult {
  success: boolean;
  message: string;
  appliedCount: number;
}

/**
 * Execute an approved AI proposal atomically.
 */
export async function executeProposalAtomically(
  proposal: AIProposal,
  floorIndex = 0
): Promise<ExecutionResult> {
  const projectStore = useProjectStore.getState();
  const currentProject = projectStore.currentProject;

  if (!currentProject) {
    return { success: false, message: 'No active project found.', appliedCount: 0 };
  }

  // 1. Final Validation Check
  const validation = validateProposal(proposal, currentProject, floorIndex);
  if (!validation.isValid) {
    const errorMsg = validation.errors.map((e) => e.reason).join(' ');
    return {
      success: false,
      message: `Cannot apply proposal: ${errorMsg}`,
      appliedCount: 0,
    };
  }

  const floor = currentProject.floors[floorIndex];
  if (!floor) {
    return { success: false, message: 'Floor not found.', appliedCount: 0 };
  }

  // 2. Snapshot "BEFORE" state
  const beforeEntities: DesignEntity[] = JSON.parse(JSON.stringify(floor.entities));
  const tempFloor: { entities: DesignEntity[] } = {
    entities: JSON.parse(JSON.stringify(floor.entities)),
  };

  // 3. Apply ALL commands to temporary state with authoritative IDs
  try {
    for (const cmd of proposal.commands) {
      applyAuthoritativeCommand(cmd, tempFloor, floorIndex);
    }

    // Clean orphaned hosted doors, windows, gates
    tempFloor.entities = cleanOrphanedEntities(tempFloor.entities);
  } catch (err) {
    // If ANY command fails, abort completely
    console.error('[AIExecutor] Execution failed mid-proposal. Aborting.', err);
    return {
      success: false,
      message: `Failed to apply commands: ${err instanceof Error ? err.message : 'Unknown error'}. No changes were made.`,
      appliedCount: 0,
    };
  }

  const afterEntities = tempFloor.entities;

  // 4. Commit to ProjectStore
  useProjectStore.setState((state) => {
    if (state.currentProject && state.currentProject.floors[floorIndex]) {
      state.currentProject.floors[floorIndex].entities = afterEntities;
      state.saveStatus = 'unsaved';
    }
  });

  // 5. Create exactly ONE history action for the entire proposal
  const historyAction = createHistoryAction(
    'AI_PROPOSAL',
    { floorIndex, entities: beforeEntities },
    { floorIndex, entities: afterEntities },
    `AI: ${proposal.title || proposal.explanation || 'Applied AI Proposal'}`
  );
  useHistoryStore.getState().push(historyAction);

  // 6. Trigger auto-save
  projectStore.saveCurrentProject().catch((err) => {
    console.warn('[AIExecutor] Save after proposal application encountered error:', err);
  });

  // 7. Update Vastu analysis if active
  const vastuStore = useVastuStore.getState();
  if (vastuStore.isVastuActive) {
    const updatedProject = useProjectStore.getState().currentProject;
    if (updatedProject) {
      vastuStore.runAnalysis(updatedProject, floorIndex);
    }
  }

  return {
    success: true,
    message: `Applied ${proposal.commands.length} change(s) successfully.`,
    appliedCount: proposal.commands.length,
  };
}

/**
 * Apply a command generating real, authoritative IDs for new objects.
 */
function applyAuthoritativeCommand(
  cmd: any,
  tempFloor: { entities: DesignEntity[] },
  floorIndex: number
): void {
  const { action, entityId, params } = cmd;
  const p = params || {};

  switch (action) {
    case 'create_room': {
      const id = `room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      tempFloor.entities.push({
        id,
        type: 'room',
        position: { x: Number(p.x) || 0, y: Number(p.y) || 0 },
        dimensions: { width: Number(p.width) || 10, height: Number(p.height) || 10 },
        rotation: 0,
        properties: {
          name: String(p.name || 'Room'),
          roomType: String(p.roomType || 'other'),
        },
        floorIndex,
        locked: false,
        visible: true,
      });
      break;
    }

    case 'create_wall': {
      const id = `wall_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const startX = Number(p.startX) || 0;
      const startY = Number(p.startY) || 0;
      const endX = Number(p.endX) || 10;
      const endY = Number(p.endY) || 0;
      const thickness = Number(p.thickness) || 0.375;

      tempFloor.entities.push({
        id,
        type: 'wall',
        position: { x: startX, y: startY },
        dimensions: { width: Math.abs(endX - startX), height: Math.abs(endY - startY) },
        rotation: 0,
        properties: { startX, startY, endX, endY, thickness },
        floorIndex,
        locked: false,
        visible: true,
      });
      break;
    }

    case 'create_door': {
      const id = `door_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const hostWallId = String(p.hostWallId);
      const offsetAlongWall = Number(p.offsetAlongWall) || 0;
      const width = Number(p.width) || 3;
      const hostWall = tempFloor.entities.find((e) => e.id === hostWallId) as WallEntity | undefined;

      let position = { x: 0, y: 0 };
      let rotation = 0;
      if (hostWall) {
        const hosted = calculateHostedPosition(
          {
            startX: hostWall.properties.startX,
            startY: hostWall.properties.startY,
            endX: hostWall.properties.endX,
            endY: hostWall.properties.endY,
          },
          offsetAlongWall
        );
        position = hosted.position;
        rotation = hosted.rotation;
      }

      tempFloor.entities.push({
        id,
        type: 'door',
        position,
        dimensions: { width, height: Number(p.height) || 7 },
        rotation,
        properties: {
          hostWallId,
          offsetAlongWall,
          doorType: p.doorType || 'single',
          swingDirection: p.swingDirection || 'right',
          swingOrientation: p.swingOrientation || 'inward',
          width,
          height: Number(p.height) || 7,
          doorRole: p.doorRole || 'interior',
        },
        floorIndex,
        locked: false,
        visible: true,
      });
      break;
    }

    case 'create_window': {
      const id = `window_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const hostWallId = String(p.hostWallId);
      const offsetAlongWall = Number(p.offsetAlongWall) || 0;
      const width = Number(p.width) || 4;
      const hostWall = tempFloor.entities.find((e) => e.id === hostWallId) as WallEntity | undefined;

      let position = { x: 0, y: 0 };
      let rotation = 0;
      if (hostWall) {
        const hosted = calculateHostedPosition(
          {
            startX: hostWall.properties.startX,
            startY: hostWall.properties.startY,
            endX: hostWall.properties.endX,
            endY: hostWall.properties.endY,
          },
          offsetAlongWall
        );
        position = hosted.position;
        rotation = hosted.rotation;
      }

      tempFloor.entities.push({
        id,
        type: 'window',
        position,
        dimensions: { width, height: Number(p.height) || 4 },
        rotation,
        properties: {
          hostWallId,
          offsetAlongWall,
          windowType: p.windowType || 'sliding',
          width,
          height: Number(p.height) || 4,
        },
        floorIndex,
        locked: false,
        visible: true,
      });
      break;
    }

    case 'create_gate': {
      const id = `gate_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const hostCompoundWallId = String(p.hostCompoundWallId);
      const hostSegmentId = String(p.hostSegmentId);
      const offsetAlongWall = Number(p.offsetAlongWall) || 0;
      const width = Number(p.width) || 8;

      const compWall = tempFloor.entities.find((e) => e.id === hostCompoundWallId) as CompoundWallEntity | undefined;
      const seg = compWall?.properties?.segments?.find((s) => s.id === hostSegmentId) || compWall?.properties?.segments?.[0];

      let position = { x: 0, y: 0 };
      let rotation = 0;
      if (seg) {
        const hosted = calculateHostedPosition(seg, offsetAlongWall);
        position = hosted.position;
        rotation = hosted.rotation;
      }

      tempFloor.entities.push({
        id,
        type: 'gate',
        position,
        dimensions: { width, height: 2 },
        rotation,
        properties: {
          hostCompoundWallId,
          hostSegmentId: seg?.id || hostSegmentId,
          offsetAlongWall,
          gateType: p.gateType || 'sliding',
          width,
        },
        floorIndex,
        locked: false,
        visible: true,
      });
      break;
    }

    case 'create_staircase':
    case 'create_parking':
    case 'create_garden':
    case 'create_column': {
      const type = action.replace('create_', '') as DesignEntity['type'];
      const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      tempFloor.entities.push({
        id,
        type,
        position: { x: Number(p.x) || 0, y: Number(p.y) || 0 },
        dimensions: {
          width: Number(p.width) || 8,
          height: Number(p.height || p.depth || p.width) || 8,
        },
        rotation: Number(p.rotation) || 0,
        properties: { ...p },
        floorIndex,
        locked: false,
        visible: true,
      });
      break;
    }

    case 'move_entity': {
      const idx = tempFloor.entities.findIndex((e) => e.id === entityId);
      if (idx === -1) throw new Error(`Entity ${entityId} not found`);
      tempFloor.entities[idx].position = {
        x: Number(p.x),
        y: Number(p.y),
      };
      break;
    }

    case 'resize_entity': {
      const idx = tempFloor.entities.findIndex((e) => e.id === entityId);
      if (idx === -1) throw new Error(`Entity ${entityId} not found`);
      tempFloor.entities[idx].dimensions = {
        width: Number(p.width),
        height: Number(p.height),
      };
      break;
    }

    case 'rotate_entity': {
      const idx = tempFloor.entities.findIndex((e) => e.id === entityId);
      if (idx === -1) throw new Error(`Entity ${entityId} not found`);
      tempFloor.entities[idx].rotation = Number(p.rotation) || 0;
      break;
    }

    case 'delete_entity': {
      tempFloor.entities = tempFloor.entities.filter((e) => e.id !== entityId);
      break;
    }

    case 'update_entity_properties': {
      const idx = tempFloor.entities.findIndex((e) => e.id === entityId);
      if (idx === -1) throw new Error(`Entity ${entityId} not found`);
      if (p.properties) {
        tempFloor.entities[idx].properties = {
          ...tempFloor.entities[idx].properties,
          ...p.properties,
        };
      }
      break;
    }

    case 'duplicate_entity': {
      const existing = tempFloor.entities.find((e) => e.id === entityId);
      if (!existing) throw new Error(`Entity ${entityId} not found`);
      const copy: DesignEntity = {
        ...JSON.parse(JSON.stringify(existing)),
        id: `${existing.type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        position: {
          x: existing.position.x + (Number(p.offsetX) || 2),
          y: existing.position.y + (Number(p.offsetY) || 2),
        },
      };
      tempFloor.entities.push(copy);
      break;
    }
  }
}
