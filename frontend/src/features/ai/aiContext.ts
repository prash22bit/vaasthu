// =============================================================================
// VastuPlan — AI Design Context Builder
//
// Builds a compact, serializable representation of the current project state
// to send to the backend AI endpoint.
//
// CRITICAL:
//   - Only include necessary geometry and semantic properties
//   - DO NOT include Konva, React, DOM, or history state
//   - Include active selection and Vastu analysis if available
// =============================================================================

import type {
  Project,
  AIDesignContext,
  VastuAnalysis,
  DesignEntity,
} from '@vastuplan/shared';

/**
 * Build a compact AIDesignContext from the current project and UI state.
 */
export function buildAIDesignContext(
  project: Project,
  floorIndex = 0,
  selectedEntityIds: string[] = [],
  vastuAnalysis?: VastuAnalysis | null
): AIDesignContext {
  const floor = project.floors[floorIndex];
  const rawEntities = floor?.entities || [];

  // Sanitize entities to ensure only serializable, relevant properties are sent
  const entities: DesignEntity[] = rawEntities.map((e) => ({
    id: e.id,
    type: e.type,
    position: { x: e.position.x, y: e.position.y },
    rotation: e.rotation || 0,
    dimensions: { width: e.dimensions.width, height: e.dimensions.height },
    properties: { ...e.properties },
    floorIndex: e.floorIndex ?? floorIndex,
    locked: !!e.locked,
    visible: e.visible !== false,
  }));

  return {
    projectId: project.id,
    projectName: project.name,
    plot: {
      shape: project.plot.shape,
      length: project.plot.length,
      width: project.plot.width,
      unit: project.plot.unit,
      facing: project.plot.facing,
      orientationDegrees: project.plot.orientationDegrees ?? 0,
    },
    floorIndex,
    entities,
    selectedEntityIds: [...selectedEntityIds],
    vastuAnalysis: vastuAnalysis || undefined,
  };
}
