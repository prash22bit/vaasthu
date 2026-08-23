import { useCallback } from 'react';
import { useCanvasStore } from '../stores/canvasStore';
import { screenToWorld, worldToScreen } from '../utils/geometry';
import { BASE_PIXELS_PER_UNIT } from '../constants';
import type { WorldPoint, ScreenPoint } from '@vastuplan/shared';

/**
 * Hook that provides coordinate transform utilities for the canvas.
 */
export function useCanvas() {
  const { zoom, panX, panY, grid } = useCanvasStore();

  const toScreen = useCallback(
    (worldX: number, worldY: number): ScreenPoint => {
      return worldToScreen(worldX, worldY, zoom, panX, panY, BASE_PIXELS_PER_UNIT);
    },
    [zoom, panX, panY]
  );

  const toWorld = useCallback(
    (screenX: number, screenY: number): WorldPoint => {
      return screenToWorld(screenX, screenY, zoom, panX, panY, BASE_PIXELS_PER_UNIT);
    },
    [zoom, panX, panY]
  );

  const worldDistToPixels = useCallback(
    (worldDist: number): number => {
      return worldDist * BASE_PIXELS_PER_UNIT * zoom;
    },
    [zoom]
  );

  return {
    zoom,
    panX,
    panY,
    grid,
    toScreen,
    toWorld,
    worldDistToPixels,
  };
}
