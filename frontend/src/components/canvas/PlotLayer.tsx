import React from 'react';
import { Group, Rect, Text, Line, Arrow } from 'react-konva';
import type { Plot } from '@vastuplan/shared';
import { BASE_PIXELS_PER_UNIT } from '../../constants';
import { useCanvasStore } from '../../stores/canvasStore';

interface PlotLayerProps {
  plot: Plot;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
}

/**
 * Renders the plot rectangle with dimension annotations.
 * Uses world coordinates internally — all values are in plot.unit.
 * Konva stage scale handles the screen transform.
 */
export const PlotLayer: React.FC<PlotLayerProps> = ({
  plot,
  isSelected,
  onSelect,
}) => {
  const zoom = useCanvasStore((s) => s.zoom);

  // Plot dimensions in screen pixels (at BASE_PPU scale, before zoom)
  // The Stage applies zoom as a scale transform, so we work in "world pixels"
  const pw = plot.width * BASE_PIXELS_PER_UNIT;
  const ph = plot.length * BASE_PIXELS_PER_UNIT;

  // Dimension annotation offset
  const dimOffset = 24;
  const arrowSize = 6;

  // Adaptive text size — smaller when zoomed out
  const dimFontSize = Math.max(8, Math.min(13, 11 / zoom));
  const labelFontSize = Math.max(7, Math.min(11, 9 / zoom));

  const unitLabel = plot.unit === 'feet' ? 'ft' : 'm';

  // Colors
  const fillColor = isSelected ? 'rgba(77, 100, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)';
  const strokeColor = isSelected ? '#4d64ff' : '#3a4268';
  const strokeWidth = isSelected ? 1.5 : 1;
  const dimColor = '#5a6280';
  const dimTextColor = '#6b7590';

  return (
    <Group>
      {/* ── Plot rectangle ─────────────────────────────────────────── */}
      <Rect
        id="canvas-plot-rect"
        x={0}
        y={0}
        width={pw}
        height={ph}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth / zoom}
        cornerRadius={0}
        onClick={onSelect}
        onTap={onSelect}
        listening={true}
        shadowColor={isSelected ? '#4d64ff' : undefined}
        shadowBlur={isSelected ? 8 / zoom : 0}
        shadowOpacity={isSelected ? 0.3 : 0}
      />

      {/* ── Selection handles (corners) ────────────────────────────── */}
      {isSelected && (
        <>
          {[
            { x: 0, y: 0 },
            { x: pw, y: 0 },
            { x: 0, y: ph },
            { x: pw, y: ph },
          ].map((corner, i) => (
            <Rect
              key={i}
              x={corner.x - 4 / zoom}
              y={corner.y - 4 / zoom}
              width={8 / zoom}
              height={8 / zoom}
              fill="#4d64ff"
              stroke="#fff"
              strokeWidth={1 / zoom}
              listening={false}
            />
          ))}
        </>
      )}

      {/* ── Width dimension (top) ──────────────────────────────────── */}
      <Group y={-dimOffset / zoom}>
        {/* Arrow line */}
        <Line
          points={[0, 0, pw, 0]}
          stroke={dimColor}
          strokeWidth={0.8 / zoom}
          listening={false}
        />
        {/* Tick marks */}
        <Line points={[0, -5 / zoom, 0, 5 / zoom]} stroke={dimColor} strokeWidth={0.8 / zoom} listening={false} />
        <Line points={[pw, -5 / zoom, pw, 5 / zoom]} stroke={dimColor} strokeWidth={0.8 / zoom} listening={false} />
        {/* Label */}
        <Text
          x={pw / 2}
          y={0}
          text={`${plot.width.toFixed(1)} ${unitLabel}`}
          fontSize={dimFontSize / zoom}
          fill={dimTextColor}
          align="center"
          offsetX={(pw / 2)}
          offsetY={(dimFontSize / zoom) / 2 + 1}
          listening={false}
          fontFamily="'JetBrains Mono', monospace"
        />
      </Group>

      {/* ── Length dimension (right) ───────────────────────────────── */}
      <Group x={pw + dimOffset / zoom}>
        <Line
          points={[0, 0, 0, ph]}
          stroke={dimColor}
          strokeWidth={0.8 / zoom}
          listening={false}
        />
        <Line points={[-5 / zoom, 0, 5 / zoom, 0]} stroke={dimColor} strokeWidth={0.8 / zoom} listening={false} />
        <Line points={[-5 / zoom, ph, 5 / zoom, ph]} stroke={dimColor} strokeWidth={0.8 / zoom} listening={false} />
        <Text
          x={0}
          y={ph / 2}
          text={`${plot.length.toFixed(1)} ${unitLabel}`}
          fontSize={dimFontSize / zoom}
          fill={dimTextColor}
          align="center"
          offsetX={-(4 / zoom)}
          offsetY={(dimFontSize / zoom) / 2}
          rotation={90}
          listening={false}
          fontFamily="'JetBrains Mono', monospace"
        />
      </Group>

      {/* ── Plot center label ──────────────────────────────────────── */}
      <Text
        x={pw / 2}
        y={ph / 2}
        text={`PLOT\n${plot.width.toFixed(1)} × ${plot.length.toFixed(1)} ${unitLabel}`}
        fontSize={labelFontSize / zoom}
        fill="rgba(139, 147, 176, 0.4)"
        align="center"
        verticalAlign="middle"
        offsetX={pw / 2}
        offsetY={ph / 2}
        listening={false}
        fontFamily="Inter, sans-serif"
        letterSpacing={1.5}
      />
    </Group>
  );
};
