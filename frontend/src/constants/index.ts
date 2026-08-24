// =============================================================================
// VastuPlan Frontend — Application Constants
// =============================================================================

// ---------------------------------------------------------------------------
// Canvas
// ---------------------------------------------------------------------------

/** Minimum zoom level (10%) */
export const ZOOM_MIN = 0.1;
/** Maximum zoom level (500%) */
export const ZOOM_MAX = 5.0;
/** Default zoom level (100%) */
export const ZOOM_DEFAULT = 1.0;
/** Zoom step per mouse wheel tick */
export const ZOOM_STEP = 0.08;
/** Zoom sensitivity multiplier */
export const ZOOM_SENSITIVITY = 0.001;

/** Pixels per world unit (foot or meter) at zoom=1 */
export const BASE_PIXELS_PER_UNIT = 10; // 10px = 1ft at default zoom

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

/** Available grid cell sizes in world units */
export const GRID_SIZES = [0.5, 1, 2, 5, 10] as const;

/** Default grid cell size in world units */
export const GRID_DEFAULT_CELL_SIZE = 1;

/** Minimum pixel gap between grid lines before switching to coarser grid */
export const GRID_MIN_VISIBLE_PIXEL_GAP = 8;

// ---------------------------------------------------------------------------
// Plot defaults
// ---------------------------------------------------------------------------

export const PLOT_DEFAULT_WIDTH = 40;
export const PLOT_DEFAULT_LENGTH = 60;
export const PLOT_DEFAULT_UNIT = 'feet' as const;
export const PLOT_DEFAULT_FACING = 'east' as const;
export const PLOT_DEFAULT_SHAPE = 'rectangle' as const;

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

/** Maximum number of undo steps */
export const HISTORY_MAX_STEPS = 100;

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/** Debounce delay for auto-save in milliseconds */
export const AUTO_SAVE_DEBOUNCE_MS = 1500;

// ---------------------------------------------------------------------------
// Demo project
// ---------------------------------------------------------------------------

export const DEMO_PROJECT_NAME = 'My Dream Home';
export const DEMO_PROJECT_WIDTH = 40;
export const DEMO_PROJECT_LENGTH = 60;
export const DEMO_PROJECT_FACING = 'east' as const;
export const DEMO_PROJECT_UNIT = 'feet' as const;

// ---------------------------------------------------------------------------
// Keyboard shortcuts
// ---------------------------------------------------------------------------

export const KEYBOARD_SHORTCUTS = {
  SAVE: { key: 's', meta: true, label: '⌘S / Ctrl+S' },
  UNDO: { key: 'z', meta: true, label: '⌘Z / Ctrl+Z' },
  REDO_WIN: { key: 'y', meta: true, label: 'Ctrl+Y' },
  REDO_MAC: { key: 'z', meta: true, shift: true, label: '⌘⇧Z' },
  ESCAPE: { key: 'Escape', label: 'Esc' },
  DELETE: { key: 'Delete', label: 'Del' },
  BACKSPACE: { key: 'Backspace', label: '⌫' },
} as const;

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

export type ToolId =
  | 'select'
  | 'pan'
  | 'wall'
  | 'column'
  | 'compound-wall'
  | 'door'
  | 'window'
  | 'gate'
  | 'room'
  | 'parking'
  | 'garden'
  | 'staircase'
  | 'dimension'
  | 'text';

export const TOOLS: { id: ToolId; label: string; icon: string; shortcut?: string; category?: string; disabled?: boolean }[] = [
  { id: 'select', label: 'Select', icon: 'MousePointer', shortcut: 'V', category: 'General' },
  { id: 'pan', label: 'Pan', icon: 'Hand', shortcut: 'H', category: 'General' },
  { id: 'wall', label: 'Wall', icon: 'Minus', shortcut: 'W', category: 'Structure' },
  { id: 'column', label: 'Column', icon: 'Columns', shortcut: 'C', category: 'Structure' },
  { id: 'compound-wall', label: 'Boundary', icon: 'Shield', shortcut: 'B', category: 'Structure' },
  { id: 'door', label: 'Door', icon: 'DoorOpen', shortcut: 'O', category: 'Openings' },
  { id: 'window', label: 'Window', icon: 'AppWindow', shortcut: 'N', category: 'Openings' },
  { id: 'gate', label: 'Gate', icon: 'DoorClosed', shortcut: 'G', category: 'Openings' },
  { id: 'room', label: 'Room', icon: 'Square', shortcut: 'R', category: 'Spaces' },
  { id: 'parking', label: 'Parking', icon: 'Car', shortcut: 'P', category: 'Spaces' },
  { id: 'garden', label: 'Garden', icon: 'Trees', shortcut: 'K', category: 'Spaces' },
  { id: 'staircase', label: 'Stairs', icon: 'Footprints', shortcut: 'T', category: 'Vertical' },
  { id: 'dimension', label: 'Dim', icon: 'Ruler', shortcut: 'D', category: 'Annotate' },
];

// ---------------------------------------------------------------------------
// Compass
// ---------------------------------------------------------------------------

export const COMPASS_SIZE = 80;
