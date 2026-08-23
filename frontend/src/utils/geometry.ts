import type { WorldPoint, ScreenPoint, WorldBounds } from '@vastuplan/shared';
import { BASE_PIXELS_PER_UNIT } from '../constants';

// ---------------------------------------------------------------------------
// Core coordinate transforms
// ---------------------------------------------------------------------------

/**
 * Convert a world-coordinate point to screen pixels.
 *
 * Formula: screen = (world * pixelsPerUnit * zoom) + pan
 *
 * @param worldX    X in world units
 * @param worldY    Y in world units
 * @param zoom      Current zoom level (1 = 100%)
 * @param panX      Canvas pan offset X in pixels
 * @param panY      Canvas pan offset Y in pixels
 * @param ppu       Pixels per world unit (default: BASE_PIXELS_PER_UNIT)
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  zoom: number,
  panX: number,
  panY: number,
  ppu = BASE_PIXELS_PER_UNIT
): ScreenPoint {
  return {
    x: worldX * ppu * zoom + panX,
    y: worldY * ppu * zoom + panY,
  };
}

/**
 * Convert a screen-pixel point back to world coordinates.
 *
 * Formula: world = (screen - pan) / (pixelsPerUnit * zoom)
 *
 * @param screenX   X in screen pixels
 * @param screenY   Y in screen pixels
 * @param zoom      Current zoom level
 * @param panX      Canvas pan offset X in pixels
 * @param panY      Canvas pan offset Y in pixels
 * @param ppu       Pixels per world unit
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  zoom: number,
  panX: number,
  panY: number,
  ppu = BASE_PIXELS_PER_UNIT
): WorldPoint {
  return {
    x: (screenX - panX) / (ppu * zoom),
    y: (screenY - panY) / (ppu * zoom),
  };
}

/**
 * Convert a world-unit distance to screen pixels.
 */
export function worldDistToScreen(worldDist: number, zoom: number, ppu = BASE_PIXELS_PER_UNIT): number {
  return worldDist * ppu * zoom;
}

/**
 * Convert a screen-pixel distance to world units.
 */
export function screenDistToWorld(screenDist: number, zoom: number, ppu = BASE_PIXELS_PER_UNIT): number {
  return screenDist / (ppu * zoom);
}

/**
 * Convert a world-coordinate bounding box to screen bounds.
 */
export function worldBoundsToScreen(
  bounds: WorldBounds,
  zoom: number,
  panX: number,
  panY: number,
  ppu = BASE_PIXELS_PER_UNIT
): { x: number; y: number; width: number; height: number } {
  const origin = worldToScreen(bounds.x, bounds.y, zoom, panX, panY, ppu);
  return {
    x: origin.x,
    y: origin.y,
    width: worldDistToScreen(bounds.width, zoom, ppu),
    height: worldDistToScreen(bounds.height, zoom, ppu),
  };
}

// ---------------------------------------------------------------------------
// Pan calculation utilities
// ---------------------------------------------------------------------------

/**
 * Calculate new pan offset so that a given world point stays fixed
 * at a given screen point when zoom changes.
 *
 * Used for zoom-to-cursor behaviour.
 *
 * @param worldPoint    The world point to keep fixed
 * @param screenPoint   The screen point where the world point should stay
 * @param newZoom       The new zoom level
 * @param ppu           Pixels per world unit
 */
export function calcPanForZoomToPoint(
  worldPoint: WorldPoint,
  screenPoint: ScreenPoint,
  newZoom: number,
  ppu = BASE_PIXELS_PER_UNIT
): { panX: number; panY: number } {
  return {
    panX: screenPoint.x - worldPoint.x * ppu * newZoom,
    panY: screenPoint.y - worldPoint.y * ppu * newZoom,
  };
}

/**
 * Calculate the pan offset to center the canvas on a given world point.
 */
export function calcPanToCenter(
  worldPoint: WorldPoint,
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  ppu = BASE_PIXELS_PER_UNIT
): { panX: number; panY: number } {
  return {
    panX: canvasWidth / 2 - worldPoint.x * ppu * zoom,
    panY: canvasHeight / 2 - worldPoint.y * ppu * zoom,
  };
}

/**
 * Calculate the initial pan offset to center a plot on the canvas.
 *
 * @param plotWidth     Plot width in world units
 * @param plotHeight    Plot height in world units
 * @param canvasWidth   Canvas width in pixels
 * @param canvasHeight  Canvas height in pixels
 * @param zoom          Current zoom level
 * @param ppu           Pixels per world unit
 */
export function calcInitialPan(
  plotWidth: number,
  plotHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  ppu = BASE_PIXELS_PER_UNIT
): { panX: number; panY: number } {
  const plotScreenW = plotWidth * ppu * zoom;
  const plotScreenH = plotHeight * ppu * zoom;
  return {
    panX: (canvasWidth - plotScreenW) / 2,
    panY: (canvasHeight - plotScreenH) / 2,
  };
}

/**
 * Clamp zoom within allowed bounds.
 */
export function clampZoom(zoom: number, min: number, max: number): number {
  return Math.min(Math.max(zoom, min), max);
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/**
 * Check if a point is inside a bounding box.
 */
export function pointInBounds(
  point: WorldPoint,
  bounds: WorldBounds
): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

/**
 * Get the center of a world bounding box.
 */
export function boundsCenter(bounds: WorldBounds): WorldPoint {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
}

/**
 * Snap a value to the nearest grid cell.
 */
export function snapToGrid(value: number, cellSize: number): number {
  return Math.round(value / cellSize) * cellSize;
}

/**
 * Snap a WorldPoint to the nearest grid intersection.
 */
export function snapPointToGrid(point: WorldPoint, cellSize: number): WorldPoint {
  return {
    x: snapToGrid(point.x, cellSize),
    y: snapToGrid(point.y, cellSize),
  };
}
