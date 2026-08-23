// Re-export all shared types for convenient import within the frontend
export * from '@vastuplan/shared';

// ---------------------------------------------------------------------------
// Frontend-specific types
// ---------------------------------------------------------------------------

import type { DesignEntityType, WorldPoint, FacingDirection } from '@vastuplan/shared';
import type { ToolId } from '../constants';

// Canvas view state
export interface CanvasViewState {
  zoom: number;
  panX: number;
  panY: number;
}

// Selection state
export interface SelectionState {
  selectedEntityId: string | null;
  selectedEntityType: DesignEntityType | null;
}

// UI state
export interface UIState {
  activeTool: ToolId;
  isNewProjectModalOpen: boolean;
  isDeleteConfirmOpen: boolean;
  deleteTargetId: string | null;
  isInspectorCollapsed: boolean;
  isToolbarCollapsed: boolean;
  isProjectListOpen: boolean;
}

// API call state
export interface ApiState {
  loading: boolean;
  error: string | null;
}

// Hover state for canvas interactions
export interface HoverState {
  entityId: string | null;
  position: WorldPoint | null;
}

// Cursor coordinates for status bar
export interface CursorCoords {
  world: WorldPoint;
  screen: WorldPoint;
}

// Extended facing direction display info
export interface FacingInfo {
  direction: FacingDirection;
  label: string;
  degrees: number;
  abbreviation: string;
}
