import React from 'react';
import { Group, Circle, Rect, Line } from 'react-konva';
import { BASE_PIXELS_PER_UNIT } from '../../constants';
import { useCanvasStore } from '../../stores/canvasStore';

export const SnapIndicatorLayer: React.FC = () => {
  const snapResult = useCanvasStore((s) => s.snapResult);
  const zoom = useCanvasStore((s) => s.zoom);

  if (!snapResult || !snapResult.indicatorPoint || snapResult.type === 'none') {
    return null;
  }

  const { point, type } = snapResult;
  const sx = point.x * BASE_PIXELS_PER_UNIT;
  const sy = point.y * BASE_PIXELS_PER_UNIT;
  const size = 8 / zoom;

  // Distinct colors and geometry for each snap type
  if (type === 'endpoint') {
    // Green square for endpoint
    return (
      <Group x={sx} y={sy} listening={false}>
        <Rect
          x={-size / 2}
          y={-size / 2}
          width={size}
          height={size}
          stroke="#10b981"
          strokeWidth={1.5 / zoom}
          fill="rgba(16, 185, 129, 0.2)"
        />
      </Group>
    );
  }

  if (type === 'midpoint') {
    // Cyan triangle for midpoint
    return (
      <Group x={sx} y={sy} listening={false}>
        <Line
          points={[0, -size / 2, size / 2, size / 2, -size / 2, size / 2]}
          closed
          stroke="#06b6d4"
          strokeWidth={1.5 / zoom}
          fill="rgba(6, 182, 212, 0.2)"
        />
      </Group>
    );
  }

  if (type === 'wall') {
    // Purple cross for wall line snap
    return (
      <Group x={sx} y={sy} listening={false}>
        <Line points={[-size, 0, size, 0]} stroke="#a855f7" strokeWidth={1.5 / zoom} />
        <Line points={[0, -size, 0, size]} stroke="#a855f7" strokeWidth={1.5 / zoom} />
      </Group>
    );
  }

  // Grid snap (blue dot)
  return (
    <Group x={sx} y={sy} listening={false}>
      <Circle
        radius={size / 2.5}
        stroke="#3b82f6"
        strokeWidth={1.5 / zoom}
        fill="rgba(59, 130, 246, 0.3)"
      />
    </Group>
  );
};
