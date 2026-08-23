import { GRID_MIN_VISIBLE_PIXEL_GAP } from '../constants';
import { worldDistToScreen } from './geometry';

/**
 * Calculate the appropriate grid cell size to display at the current zoom level.
 *
 * Returns the smallest grid size that still has at least MIN_GAP pixels between lines.
 * Picks from a list of candidate sizes.
 *
 * @param baseGridSize  Base grid cell size in world units (from project settings)
 * @param zoom          Current zoom level
 * @param ppu           Pixels per world unit
 */
export function calcVisibleGridSize(
  baseGridSize: number,
  zoom: number,
  ppu: number
): number {
  // Candidate sizes are multiples of the base size
  const candidates = [
    baseGridSize / 10,
    baseGridSize / 5,
    baseGridSize / 2,
    baseGridSize,
    baseGridSize * 2,
    baseGridSize * 5,
    baseGridSize * 10,
    baseGridSize * 50,
    baseGridSize * 100,
  ];

  for (const size of candidates) {
    const pixelGap = worldDistToScreen(size, zoom, ppu);
    if (pixelGap >= GRID_MIN_VISIBLE_PIXEL_GAP) {
      return size;
    }
  }

  // Fallback to largest candidate
  return candidates[candidates.length - 1];
}

/**
 * Calculate which major grid lines to draw.
 * Major lines (every 10 cells) are drawn slightly brighter.
 */
export function isMajorGridLine(coord: number, cellSize: number, majorInterval = 10): boolean {
  return Math.round(Math.abs(coord / cellSize)) % majorInterval === 0;
}

/**
 * Get the starting grid line value for a given view range.
 *
 * @param viewStart     Start of visible range in world units
 * @param cellSize      Grid cell size in world units
 */
export function gridStart(viewStart: number, cellSize: number): number {
  return Math.floor(viewStart / cellSize) * cellSize;
}
