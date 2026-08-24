import React from 'react';
import { Group, Rect, Circle, Line, Text } from 'react-konva';
import type { ColumnEntity } from '@vastuplan/shared';
import { useCanvasStore } from '../../stores/canvasStore';
import { BASE_PIXELS_PER_UNIT } from '../../constants';

interface ColumnsLayerProps {
  columns: ColumnEntity[];
  zoom: number;
}

export const ColumnsLayer: React.FC<ColumnsLayerProps> = ({ columns, zoom }) => {
  const { selectedEntityId, selectedEntityIds, setSelectedEntity } = useCanvasStore();

  return (
    <Group id="columns-layer">
      {columns.map((col) => {
        if (!col.visible) return null;

        const isSelected =
          selectedEntityId === col.id || selectedEntityIds.includes(col.id);
        const wPx = (col.properties.width || 0.75) * BASE_PIXELS_PER_UNIT;
        const dPx = (col.properties.depth || 0.75) * BASE_PIXELS_PER_UNIT;
        const isCircle = col.properties.shape === 'circle';
        const diameterPx = (col.properties.diameter || col.properties.width || 0.75) * BASE_PIXELS_PER_UNIT;

        return (
          <Group
            key={col.id}
            x={col.position.x * BASE_PIXELS_PER_UNIT}
            y={col.position.y * BASE_PIXELS_PER_UNIT}
            rotation={col.rotation}
            onClick={(e) => {
              e.cancelBubble = true;
              setSelectedEntity(col.id, 'column');
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              setSelectedEntity(col.id, 'column');
            }}
          >
            {isCircle ? (
              /* Circular Column */
              <Group>
                <Circle
                  radius={diameterPx / 2}
                  fill="#334155"
                  stroke={isSelected ? '#38bdf8' : '#0f172a'}
                  strokeWidth={(isSelected ? 2 : 1.5) / zoom}
                />
                <Line
                  points={[-diameterPx / 3, 0, diameterPx / 3, 0]}
                  stroke="#94a3b8"
                  strokeWidth={1 / zoom}
                />
                <Line
                  points={[0, -diameterPx / 3, 0, diameterPx / 3]}
                  stroke="#94a3b8"
                  strokeWidth={1 / zoom}
                />
              </Group>
            ) : (
              /* Rectangular Column with Crosshatching */
              <Group>
                <Rect
                  x={-wPx / 2}
                  y={-dPx / 2}
                  width={wPx}
                  height={dPx}
                  fill="#334155"
                  stroke={isSelected ? '#38bdf8' : '#0f172a'}
                  strokeWidth={(isSelected ? 2 : 1.5) / zoom}
                  dash={isSelected ? [4 / zoom, 4 / zoom] : undefined}
                />
                {/* Diagonal Crosshatch Lines */}
                <Line
                  points={[-wPx / 2, -dPx / 2, wPx / 2, dPx / 2]}
                  stroke="#94a3b8"
                  strokeWidth={1 / zoom}
                />
                <Line
                  points={[wPx / 2, -dPx / 2, -wPx / 2, dPx / 2]}
                  stroke="#94a3b8"
                  strokeWidth={1 / zoom}
                />
              </Group>
            )}

            {/* Label */}
            <Text
              x={-wPx}
              y={dPx / 2 + 3 / zoom}
              text={`${Math.round(col.properties.width * 12)}×${Math.round(col.properties.depth * 12)}" Column`}
              fontSize={7.5 / zoom}
              fill="#94a3b8"
              align="center"
              width={wPx * 2}
            />
          </Group>
        );
      })}
    </Group>
  );
};
