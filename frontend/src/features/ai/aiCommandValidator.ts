// =============================================================================
// VastuPlan — AI Command Validator
//
// Validates structured AI commands against the actual CAD project state before
// preview or execution.
//
// Principles:
//   - AI proposals are UNTRUSTED
//   - Must validate geometry, boundary, occupancy, and reference integrity
//   - Reuses existing architectural utilities (validateWallOccupancy, etc.)
//   - Returns structured validation errors (severity: 'error' | 'warning')
// =============================================================================

import type {
  Project,
  AIProposal,
  AICommand,
  AIValidationError,
  WallEntity,
  CompoundWallEntity,
  CompoundWallSegment,
} from '@vastuplan/shared';
import { validateWallOccupancy, calculateHostedPosition } from '../../utils/architectural';
import { distanceBetweenPoints } from '../../utils/geometry';

export interface ValidationResult {
  isValid: boolean;
  errors: AIValidationError[];
  warnings: string[];
}

/**
 * Validate an entire AI Proposal against the project state.
 */
export function validateProposal(
  proposal: AIProposal,
  project: Project,
  floorIndex = 0,
  userConstraints?: string[]
): ValidationResult {
  const errors: AIValidationError[] = [];
  const warnings: string[] = [];

  const floor = project.floors[floorIndex];
  if (!floor) {
    errors.push({
      reason: `Floor at index ${floorIndex} does not exist in the project.`,
      severity: 'error',
    });
    return { isValid: false, errors, warnings };
  }

  const { plot } = project;
  const entities = floor.entities;
  const entityMap = new Map(entities.map((e) => [e.id, e]));

  if (!proposal.commands || proposal.commands.length === 0) {
    warnings.push('Proposal contains no actions.');
    return { isValid: true, errors, warnings };
  }

  for (const cmd of proposal.commands) {
    validateSingleCommand(cmd, entityMap, plot, errors, warnings, userConstraints);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate an individual AI command.
 */
function validateSingleCommand(
  cmd: AICommand,
  entityMap: Map<string, any>,
  plot: Project['plot'],
  errors: AIValidationError[],
  warnings: string[],
  userConstraints?: string[]
): void {
  const { action, entityId, params } = cmd;

  if (!params || typeof params !== 'object') {
    errors.push({
      commandId: cmd.id,
      reason: `Command ${action} has invalid or missing parameters.`,
      severity: 'error',
    });
    return;
  }

  // ── 1. Reference validation for modifying existing entities ──
  const requiresExistingEntity = [
    'move_entity',
    'resize_entity',
    'rotate_entity',
    'delete_entity',
    'update_entity_properties',
    'duplicate_entity',
  ].includes(action);

  if (requiresExistingEntity) {
    if (!entityId) {
      errors.push({
        commandId: cmd.id,
        reason: `Command ${action} requires an entityId.`,
        severity: 'error',
      });
      return;
    }

    const existing = entityMap.get(entityId);
    if (!existing) {
      errors.push({
        commandId: cmd.id,
        reason: `Referenced entity with ID "${entityId}" does not exist on this floor.`,
        severity: 'error',
      });
      return;
    }

    // Check user constraints
    if (userConstraints && userConstraints.length > 0) {
      const roomType = existing.properties?.roomType;
      const entityName = existing.properties?.name || existing.type;
      for (const constraint of userConstraints) {
        const lowerConstraint = constraint.toLowerCase();
        if (
          (roomType && lowerConstraint.includes(String(roomType).toLowerCase())) ||
          (entityName && lowerConstraint.includes(String(entityName).toLowerCase()))
        ) {
          errors.push({
            commandId: cmd.id,
            reason: `Action violates user constraint: "${constraint}" for ${entityName}.`,
            severity: 'error',
          });
          return;
        }
      }
    }
  }

  // ── 2. Action-specific parameter and boundary validations ──
  switch (action) {
    case 'move_entity': {
      const x = Number(params.x);
      const y = Number(params.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        errors.push({
          commandId: cmd.id,
          reason: `Invalid move coordinates: x=${params.x}, y=${params.y}.`,
          severity: 'error',
        });
        return;
      }

      const existing = entityMap.get(entityId!);
      const width = existing?.dimensions?.width || 0;
      const height = existing?.dimensions?.height || 0;

      if (x < -0.01 || y < -0.01 || x + width > plot.width + 0.01 || y + height > plot.length + 0.01) {
        errors.push({
          commandId: cmd.id,
          reason: `Proposed position (${x.toFixed(1)}, ${y.toFixed(1)}) places the entity outside the plot boundary (${plot.width}×${plot.length} ${plot.unit}).`,
          severity: 'error',
        });
      }
      break;
    }

    case 'resize_entity': {
      const width = Number(params.width);
      const height = Number(params.height);
      if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
        errors.push({
          commandId: cmd.id,
          reason: `Invalid dimensions for resize: width=${params.width}, height=${params.height}. Dimensions must be positive numbers.`,
          severity: 'error',
        });
        return;
      }

      const existing = entityMap.get(entityId!);
      if (existing) {
        const x = existing.position.x;
        const y = existing.position.y;
        if (x + width > plot.width + 0.01 || y + height > plot.length + 0.01) {
          errors.push({
            commandId: cmd.id,
            reason: `Resized dimensions (${width}×${height}) extend outside the plot boundary.`,
            severity: 'error',
          });
        }
      }
      break;
    }

    case 'rotate_entity': {
      const rotation = Number(params.rotation);
      if (!Number.isFinite(rotation)) {
        errors.push({
          commandId: cmd.id,
          reason: `Invalid rotation value: ${params.rotation}.`,
          severity: 'error',
        });
      }
      break;
    }

    case 'create_room': {
      const x = Number(params.x);
      const y = Number(params.y);
      const width = Number(params.width);
      const height = Number(params.height);

      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
        errors.push({
          commandId: cmd.id,
          reason: 'create_room requires finite numbers for x, y, width, and height.',
          severity: 'error',
        });
        return;
      }

      if (width <= 0 || height <= 0) {
        errors.push({
          commandId: cmd.id,
          reason: `Room dimensions must be positive numbers. Got ${width}×${height}.`,
          severity: 'error',
        });
        return;
      }

      if (x < -0.01 || y < -0.01 || x + width > plot.width + 0.01 || y + height > plot.length + 0.01) {
        errors.push({
          commandId: cmd.id,
          reason: `Room position (${x},${y}) with size (${width}×${height}) is outside plot bounds (${plot.width}×${plot.length}).`,
          severity: 'error',
        });
      }
      break;
    }

    case 'create_wall': {
      const startX = Number(params.startX);
      const startY = Number(params.startY);
      const endX = Number(params.endX);
      const endY = Number(params.endY);

      if (!Number.isFinite(startX) || !Number.isFinite(startY) || !Number.isFinite(endX) || !Number.isFinite(endY)) {
        errors.push({
          commandId: cmd.id,
          reason: 'create_wall requires finite coordinates for startX, startY, endX, endY.',
          severity: 'error',
        });
        return;
      }

      const wallLen = distanceBetweenPoints({ x: startX, y: startY }, { x: endX, y: endY });
      if (wallLen <= 0.1) {
        errors.push({
          commandId: cmd.id,
          reason: `Wall length is too small (${wallLen.toFixed(2)}). Must be at least 0.1 ${plot.unit}.`,
          severity: 'error',
        });
      }

      if (
        startX < -0.01 || startX > plot.width + 0.01 ||
        startY < -0.01 || startY > plot.length + 0.01 ||
        endX < -0.01 || endX > plot.width + 0.01 ||
        endY < -0.01 || endY > plot.length + 0.01
      ) {
        errors.push({
          commandId: cmd.id,
          reason: `Wall endpoints (${startX},${startY}) → (${endX},${endY}) are outside the plot boundary.`,
          severity: 'error',
        });
      }
      break;
    }

    case 'create_door':
    case 'create_window': {
      const hostWallId = String(params.hostWallId || '');
      const offsetAlongWall = Number(params.offsetAlongWall);
      const width = Number(params.width);

      if (!hostWallId) {
        errors.push({
          commandId: cmd.id,
          reason: `${action} requires a hostWallId.`,
          severity: 'error',
        });
        return;
      }

      const hostWall = entityMap.get(hostWallId) as WallEntity | undefined;
      if (!hostWall || hostWall.type !== 'wall') {
        errors.push({
          commandId: cmd.id,
          reason: `Host wall "${hostWallId}" does not exist or is not a structural wall.`,
          severity: 'error',
        });
        return;
      }

      if (!Number.isFinite(offsetAlongWall) || !Number.isFinite(width) || width <= 0) {
        errors.push({
          commandId: cmd.id,
          reason: `Invalid offset (${params.offsetAlongWall}) or width (${params.width}) for ${action}.`,
          severity: 'error',
        });
        return;
      }

      // Collect existing hosted doors/windows on this wall
      const existingHosted = Array.from(entityMap.values())
        .filter((e) => (e.type === 'door' || e.type === 'window') && e.properties?.hostWallId === hostWallId)
        .map((e) => ({
          id: e.id,
          properties: {
            offsetAlongWall: Number(e.properties.offsetAlongWall),
            width: Number(e.properties.width),
          },
        }));

      const wallSegment = {
        startX: hostWall.properties.startX,
        startY: hostWall.properties.startY,
        endX: hostWall.properties.endX,
        endY: hostWall.properties.endY,
      };

      const occupancyCheck = validateWallOccupancy(wallSegment, existingHosted, offsetAlongWall, width);
      if (!occupancyCheck.valid) {
        errors.push({
          commandId: cmd.id,
          reason: occupancyCheck.reason || `${action} placement violates wall occupancy constraints.`,
          severity: 'error',
        });
      }
      break;
    }

    case 'create_gate': {
      const hostCompoundWallId = String(params.hostCompoundWallId || '');
      const hostSegmentId = String(params.hostSegmentId || '');
      const offsetAlongWall = Number(params.offsetAlongWall);
      const width = Number(params.width);

      if (!hostCompoundWallId) {
        errors.push({
          commandId: cmd.id,
          reason: 'create_gate requires a hostCompoundWallId.',
          severity: 'error',
        });
        return;
      }

      const hostWall = entityMap.get(hostCompoundWallId) as CompoundWallEntity | undefined;
      if (!hostWall || hostWall.type !== 'compound-wall') {
        errors.push({
          commandId: cmd.id,
          reason: `Host compound wall "${hostCompoundWallId}" does not exist.`,
          severity: 'error',
        });
        return;
      }

      const segments = (hostWall.properties?.segments || []) as CompoundWallSegment[];
      const segment = segments.find((s) => s.id === hostSegmentId) || segments[0];

      if (!segment) {
        errors.push({
          commandId: cmd.id,
          reason: `Host compound wall segment "${hostSegmentId}" does not exist.`,
          severity: 'error',
        });
        return;
      }

      const segmentLen = distanceBetweenPoints(
        { x: segment.startX, y: segment.startY },
        { x: segment.endX, y: segment.endY }
      );

      if (offsetAlongWall < 0 || offsetAlongWall + width > segmentLen + 0.01) {
        errors.push({
          commandId: cmd.id,
          reason: `Gate width (${width}) at offset (${offsetAlongWall}) exceeds compound wall segment length (${segmentLen.toFixed(1)}).`,
          severity: 'error',
        });
      }
      break;
    }

    case 'create_staircase':
    case 'create_parking':
    case 'create_garden':
    case 'create_column': {
      const x = Number(params.x);
      const y = Number(params.y);
      const width = Number(params.width);
      const height = Number(params.height || params.depth || width);

      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
        errors.push({
          commandId: cmd.id,
          reason: `${action} requires finite numbers for x, y, width, and height.`,
          severity: 'error',
        });
        return;
      }

      if (width <= 0 || height <= 0) {
        errors.push({
          commandId: cmd.id,
          reason: `${action} dimensions must be positive.`,
          severity: 'error',
        });
        return;
      }

      if (x < -0.01 || y < -0.01 || x + width > plot.width + 0.01 || y + height > plot.length + 0.01) {
        errors.push({
          commandId: cmd.id,
          reason: `${action} at (${x},${y}) size (${width}×${height}) exceeds plot bounds (${plot.width}×${plot.length}).`,
          severity: 'error',
        });
      }
      break;
    }

    case 'delete_entity':
      // Entity existence is already checked above
      break;

    case 'duplicate_entity':
    case 'update_entity_properties':
      break;

    default:
      warnings.push(`Unrecognized AI command action: ${action}`);
      break;
  }
}
