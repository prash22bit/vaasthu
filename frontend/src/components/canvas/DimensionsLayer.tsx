import React from 'react';
import { Group, Line, Text } from 'react-konva';
import type { DimensionEntity } from '@vastuplan/shared';
import { BASE_PIXELS_PER_UNIT } from '../../constants';
import { useCanvasStore } from '../../stores/canvasStore';
import { distanceBetweenPoints, calculateAngle } from '../../utils/geometry';

interface DimensionsLayerProps {
  dimensions: DimensionEntity[];
  selectedEntityIds: string[];
  unit: string;
}

export const DimensionsLayer: React.FC<DimensionsLayerProps> = ({
  dimensions,
  selectedEntityIds,
  unit,
}) => {
  const zoom = useCanvasStore((s) => s.zoom);
  const setSelectedEntity = useCanvasStore((s) => s.setSelectedEntity);
  const toggleSelectEntity = useCanvasStore((s) => s.toggleSelectEntity);

  const unitLabel = unit === 'feet' ? 'ft' : 'm';

  return (
    <Group>
      {dimensions.map((dim) => {
        const isSelected = selectedEntityIds.includes(dim.id);

        const p1 = { x: dim.properties.startX, y: dim.properties.startY };
        const p2 = { x: dim.properties.endX, y: dim.properties.endY };
        const length = distanceBetweenPoints(p1, p2);
        const angle = calculateAngle(p1, p2);

        const sx = p1.x * BASE_PIXELS_PER_UNIT;
        const sy = p1.y * BASE_PIXELS_PER_UNIT;
        const dimW = length * BASE_PIXELS_PER_UNIT;
        const offset = (dim.properties.offset || 1.5) * BASE_PIXELS_PER_UNIT;

        const color = isSelected ? '#a855f7' : '#ec4899';
        const fontSize = Math.max(8, Math.min(12, 10 / zoom));

        return (
          <Group
            key={dim.id}
            x={sx}
            y={sy}
            rotation={angle}
            onClick={(e) => {
              e.cancelBubble = true;
              if (e.evt.shiftKey) {
                toggleSelectEntity(dim.id, 'dimension');
              } else {
                setSelectedEntity(dim.id, 'dimension');
              }
            }}
          >
            {/* Extension line offset */}
            <Group y={-offset}>
              {/* Dimension main line */}
              <Line
                points={[0, 0, dimW, 0]}
                stroke={color}
                strokeWidth={(isSelected ? 1.5 : 1) / zoom}
                dash={isSelected ? undefined : [3 / zoom, 2 / zoom]}
              />

              {/* Ticks at ends */}
              <Line
                points={[0, -4 / zoom, 0, 4 / zoom]}
                stroke={color}
                strokeWidth={1.5 / zoom}
              />
              <Line
                points={[dimW, -4 / zoom, dimW, 4 / zoom]}
                stroke={color}
                strokeWidth={1.5 / zoom}
              />

              {/* Distance text */}
              <Text
                x={dimW / 2}
                y={-12 / zoom}
                text={`${length.toFixed(1)} ${unitLabel}`}
                fontSize={fontSize}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="500"
                fill={color}
                align="center"
                offsetX={25 / zoom}
                listening={false}
              />
            </Group>
          </Group>
        );
      })}
    </Group>
  );
};
