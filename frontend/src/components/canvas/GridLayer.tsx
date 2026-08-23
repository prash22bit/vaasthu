import React from 'react';
import { Line } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useCanvasStore } from '../../stores/canvasStore';
import { calcVisibleGridSize, gridStart } from '../../utils/grid';
import { BASE_PIXELS_PER_UNIT } from '../../constants';

interface GridLayerProps {
  width: number;
  height: number;
}

/**
 * Renders an adaptive grid on the canvas.
 * Grid lines are calculated in world coordinates and converted to screen pixels
 * via the Konva stage transform (handled automatically via Stage scale/position).
 *
 * We draw in "stage space" (before zoom/pan transform) — Konva handles the rest.
 */
export const GridLayer: React.FC<GridLayerProps> = ({ width, height }) => {
  const { zoom, panX, panY, grid } = useCanvasStore();

  if (!grid.visible) return null;

  // Calculate the visible world range
  const worldLeft = -panX / (BASE_PIXELS_PER_UNIT * zoom);
  const worldTop = -panY / (BASE_PIXELS_PER_UNIT * zoom);
  const worldRight = (width - panX) / (BASE_PIXELS_PER_UNIT * zoom);
  const worldBottom = (height - panY) / (BASE_PIXELS_PER_UNIT * zoom);

  // Choose grid cell size that's legible at current zoom
  const cellSize = calcVisibleGridSize(grid.cellSize, zoom, BASE_PIXELS_PER_UNIT);

  // Generate vertical lines
  const vLines: React.ReactNode[] = [];
  const startX = gridStart(worldLeft, cellSize);
  for (let wx = startX; wx <= worldRight; wx += cellSize) {
    const sx = wx * BASE_PIXELS_PER_UNIT;
    const isMajor = Math.round(Math.abs(wx / cellSize)) % 10 === 0;

    vLines.push(
      <Line
        key={`v_${wx.toFixed(6)}`}
        points={[sx, worldTop * BASE_PIXELS_PER_UNIT, sx, worldBottom * BASE_PIXELS_PER_UNIT]}
        stroke={isMajor ? '#252840' : '#1a1f35'}
        strokeWidth={isMajor ? 0.5 : 0.4}
        listening={false}
        perfectDrawEnabled={false}
      />
    );
  }

  // Generate horizontal lines
  const hLines: React.ReactNode[] = [];
  const startY = gridStart(worldTop, cellSize);
  for (let wy = startY; wy <= worldBottom; wy += cellSize) {
    const sy = wy * BASE_PIXELS_PER_UNIT;
    const isMajor = Math.round(Math.abs(wy / cellSize)) % 10 === 0;

    hLines.push(
      <Line
        key={`h_${wy.toFixed(6)}`}
        points={[worldLeft * BASE_PIXELS_PER_UNIT, sy, worldRight * BASE_PIXELS_PER_UNIT, sy]}
        stroke={isMajor ? '#252840' : '#1a1f35'}
        strokeWidth={isMajor ? 0.5 : 0.4}
        listening={false}
        perfectDrawEnabled={false}
      />
    );
  }

  return (
    <>
      {vLines}
      {hLines}
    </>
  );
};
