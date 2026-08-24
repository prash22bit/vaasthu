// =============================================================================
// VastuPlan — AI Proposal Preview Projection
//
// Generates a temporary, derived project state by applying proposed AI commands
// to a deep clone of the current project.
//
// INVARIANTS:
//   - The real project is NEVER mutated
//   - Computes entity diffs (added, removed, moved, resized, updated)
//   - Evaluates Vastu impact using the official analyzeVastu() engine
//   - Discards preview on any failure
// =============================================================================

import type {
  Project,
  AIProposal,
  DesignEntity,
  WorldPoint,
  WorldDimensions,
  VastuAnalysis,
  WallEntity,
  CompoundWallEntity,
} from '@vastuplan/shared';
import { analyzeVastu } from '../vastu/vastuEngine';
import { calculateHostedPosition, updateHostedEntitiesOnWallUpdate, cleanOrphanedEntities } from '../../utils/architectural';

export interface EntityDiff {
  id: string;
  type: string;
  name?: string;
  changeType: 'added' | 'removed' | 'moved' | 'resized' | 'rotated' | 'updated';
  before?: {
    position?: WorldPoint;
    dimensions?: WorldDimensions;
    rotation?: number;
    properties?: Record<string, unknown>;
  };
  after?: {
    position?: WorldPoint;
    dimensions?: WorldDimensions;
    rotation?: number;
    properties?: Record<string, unknown>;
  };
}

export interface ProposalPreviewResult {
  previewProject: Project;
  diffs: EntityDiff[];
  currentVastuScore?: number;
  proposedVastuScore?: number;
  vastuDelta?: number;
  previewAnalysis?: VastuAnalysis;
}

/**
 * Generate a complete preview projection from a project and proposal.
 */
export function generateProposalPreview(
  project: Project,
  proposal: AIProposal,
  floorIndex = 0
): ProposalPreviewResult {
  // 1. Deep clone the project
  const previewProject: Project = JSON.parse(JSON.stringify(project));
  const floor = previewProject.floors[floorIndex];
  if (!floor) {
    throw new Error(`Floor index ${floorIndex} does not exist in the project.`);
  }

  const initialEntities = [...floor.entities];
  const initialMap = new Map(initialEntities.map((e) => [e.id, JSON.parse(JSON.stringify(e))]));

  // 2. Apply commands sequentially to the clone
  for (const cmd of proposal.commands) {
    applyCommandToFloor(cmd, floor);
  }

  // Clean any orphaned doors/windows/gates after potential wall changes
  floor.entities = cleanOrphanedEntities(floor.entities);

  // 3. Compute Diffs
  const diffs: EntityDiff[] = [];
  const afterMap = new Map(floor.entities.map((e) => [e.id, e]));

  // Find added & modified
  for (const [id, after] of afterMap.entries()) {
    const before = initialMap.get(id);
    if (!before) {
      diffs.push({
        id,
        type: after.type,
        name: (after.properties?.name as string) || after.type,
        changeType: 'added',
        after: {
          position: { ...after.position },
          dimensions: { ...after.dimensions },
          rotation: after.rotation,
          properties: { ...after.properties },
        },
      });
    } else {
      const posChanged =
        Math.abs(before.position.x - after.position.x) > 0.01 ||
        Math.abs(before.position.y - after.position.y) > 0.01;
      const dimChanged =
        Math.abs(before.dimensions.width - after.dimensions.width) > 0.01 ||
        Math.abs(before.dimensions.height - after.dimensions.height) > 0.01;
      const rotChanged = Math.abs((before.rotation || 0) - (after.rotation || 0)) > 0.1;

      if (posChanged) {
        diffs.push({
          id,
          type: after.type,
          name: (after.properties?.name as string) || after.type,
          changeType: 'moved',
          before: { position: { ...before.position } },
          after: { position: { ...after.position } },
        });
      } else if (dimChanged) {
        diffs.push({
          id,
          type: after.type,
          name: (after.properties?.name as string) || after.type,
          changeType: 'resized',
          before: { dimensions: { ...before.dimensions } },
          after: { dimensions: { ...after.dimensions } },
        });
      } else if (rotChanged) {
        diffs.push({
          id,
          type: after.type,
          name: (after.properties?.name as string) || after.type,
          changeType: 'rotated',
          before: { rotation: before.rotation },
          after: { rotation: after.rotation },
        });
      }
    }
  }

  // Find removed
  for (const [id, before] of initialMap.entries()) {
    if (!afterMap.has(id)) {
      diffs.push({
        id,
        type: before.type,
        name: (before.properties?.name as string) || before.type,
        changeType: 'removed',
        before: {
          position: { ...before.position },
          dimensions: { ...before.dimensions },
        },
      });
    }
  }

  // 4. Calculate Vastu Impact using official engine
  let currentVastuScore: number | undefined;
  let proposedVastuScore: number | undefined;
  let vastuDelta: number | undefined;
  let previewAnalysis: VastuAnalysis | undefined;

  try {
    const currentAnalysis = analyzeVastu(project, floorIndex);
    currentVastuScore = currentAnalysis.overallScore;

    previewAnalysis = analyzeVastu(previewProject, floorIndex);
    proposedVastuScore = previewAnalysis.overallScore;
    vastuDelta = proposedVastuScore - currentVastuScore;
  } catch (err) {
    console.warn('[ProposalPreview] Vastu preview calculation skipped:', err);
  }

  return {
    previewProject,
    diffs,
    currentVastuScore,
    proposedVastuScore,
    vastuDelta,
    previewAnalysis,
  };
}

/**
 * Apply a single AI command to a cloned floor.
 */
function applyCommandToFloor(cmd: any, floor: { entities: DesignEntity[] }): void {
  const { action, entityId, params } = cmd;
  const p = params || {};

  switch (action) {
    case 'create_room': {
      const newRoom: DesignEntity = {
        id: `room_preview_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'room',
        position: { x: Number(p.x) || 0, y: Number(p.y) || 0 },
        dimensions: { width: Number(p.width) || 10, height: Number(p.height) || 10 },
        rotation: 0,
        properties: {
          name: String(p.name || 'Room'),
          roomType: String(p.roomType || 'other'),
        },
        floorIndex: 0,
        locked: false,
        visible: true,
      };
      floor.entities.push(newRoom);
      break;
    }

    case 'create_wall': {
      const startX = Number(p.startX) || 0;
      const startY = Number(p.startY) || 0;
      const endX = Number(p.endX) || 10;
      const endY = Number(p.endY) || 0;
      const thickness = Number(p.thickness) || 0.375;

      const newWall: DesignEntity = {
        id: `wall_preview_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'wall',
        position: { x: startX, y: startY },
        dimensions: { width: Math.abs(endX - startX), height: Math.abs(endY - startY) },
        rotation: 0,
        properties: { startX, startY, endX, endY, thickness },
        floorIndex: 0,
        locked: false,
        visible: true,
      };
      floor.entities.push(newWall);
      break;
    }

    case 'create_door': {
      const hostWallId = String(p.hostWallId);
      const offsetAlongWall = Number(p.offsetAlongWall) || 0;
      const width = Number(p.width) || 3;
      const hostWall = floor.entities.find((e) => e.id === hostWallId) as WallEntity | undefined;

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

      const newDoor: DesignEntity = {
        id: `door_preview_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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
        floorIndex: 0,
        locked: false,
        visible: true,
      };
      floor.entities.push(newDoor);
      break;
    }

    case 'create_window': {
      const hostWallId = String(p.hostWallId);
      const offsetAlongWall = Number(p.offsetAlongWall) || 0;
      const width = Number(p.width) || 4;
      const hostWall = floor.entities.find((e) => e.id === hostWallId) as WallEntity | undefined;

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

      const newWindow: DesignEntity = {
        id: `window_preview_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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
        floorIndex: 0,
        locked: false,
        visible: true,
      };
      floor.entities.push(newWindow);
      break;
    }

    case 'create_gate': {
      const hostCompoundWallId = String(p.hostCompoundWallId);
      const hostSegmentId = String(p.hostSegmentId);
      const offsetAlongWall = Number(p.offsetAlongWall) || 0;
      const width = Number(p.width) || 8;

      const compWall = floor.entities.find((e) => e.id === hostCompoundWallId) as CompoundWallEntity | undefined;
      const seg = compWall?.properties?.segments?.find((s) => s.id === hostSegmentId) || compWall?.properties?.segments?.[0];

      let position = { x: 0, y: 0 };
      let rotation = 0;
      if (seg) {
        const hosted = calculateHostedPosition(seg, offsetAlongWall);
        position = hosted.position;
        rotation = hosted.rotation;
      }

      const newGate: DesignEntity = {
        id: `gate_preview_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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
        floorIndex: 0,
        locked: false,
        visible: true,
      };
      floor.entities.push(newGate);
      break;
    }

    case 'create_staircase':
    case 'create_parking':
    case 'create_garden':
    case 'create_column': {
      const type = action.replace('create_', '') as DesignEntity['type'];
      const newEntity: DesignEntity = {
        id: `${type}_preview_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type,
        position: { x: Number(p.x) || 0, y: Number(p.y) || 0 },
        dimensions: {
          width: Number(p.width) || 8,
          height: Number(p.height || p.depth || p.width) || 8,
        },
        rotation: Number(p.rotation) || 0,
        properties: { ...p },
        floorIndex: 0,
        locked: false,
        visible: true,
      };
      floor.entities.push(newEntity);
      break;
    }

    case 'move_entity': {
      const idx = floor.entities.findIndex((e) => e.id === entityId);
      if (idx !== -1) {
        floor.entities[idx].position = {
          x: Number(p.x),
          y: Number(p.y),
        };
      }
      break;
    }

    case 'resize_entity': {
      const idx = floor.entities.findIndex((e) => e.id === entityId);
      if (idx !== -1) {
        floor.entities[idx].dimensions = {
          width: Number(p.width),
          height: Number(p.height),
        };
      }
      break;
    }

    case 'rotate_entity': {
      const idx = floor.entities.findIndex((e) => e.id === entityId);
      if (idx !== -1) {
        floor.entities[idx].rotation = Number(p.rotation) || 0;
      }
      break;
    }

    case 'delete_entity': {
      floor.entities = floor.entities.filter((e) => e.id !== entityId);
      break;
    }

    case 'update_entity_properties': {
      const idx = floor.entities.findIndex((e) => e.id === entityId);
      if (idx !== -1 && p.properties) {
        floor.entities[idx].properties = {
          ...floor.entities[idx].properties,
          ...p.properties,
        };
      }
      break;
    }

    case 'duplicate_entity': {
      const existing = floor.entities.find((e) => e.id === entityId);
      if (existing) {
        const copy: DesignEntity = {
          ...JSON.parse(JSON.stringify(existing)),
          id: `${existing.type}_preview_copy_${Date.now()}`,
          position: {
            x: existing.position.x + (Number(p.offsetX) || 2),
            y: existing.position.y + (Number(p.offsetY) || 2),
          },
        };
        floor.entities.push(copy);
      }
      break;
    }
  }
}
