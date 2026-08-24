import React from 'react';
import { Group, Rect, Line, Arrow, Text } from 'react-konva';
import type { StaircaseEntity } from '@vastuplan/shared';
import { useCanvasStore } from '../../stores/canvasStore';
import { BASE_PIXELS_PER_UNIT } from '../../constants';

interface StaircasesLayerProps {
  staircases: StaircaseEntity[];
  zoom: number;
}

export const StaircasesLayer: React.FC<StaircasesLayerProps> = ({ staircases, zoom }) => {
  const { selectedEntityId, selectedEntityIds, setSelectedEntity } = useCanvasStore();

  return (
    <Group id="staircases-layer">
      {staircases.map((stair) => {
        if (!stair.visible) return null;

        const isSelected =
          selectedEntityId === stair.id || selectedEntityIds.includes(stair.id);
        const wPx = stair.dimensions.width * BASE_PIXELS_PER_UNIT;
        const hPx = stair.dimensions.height * BASE_PIXELS_PER_UNIT;
        const stepCount = stair.properties.steps || 18;
        const direction = stair.properties.direction || 'up';

        // Draw horizontal step lines
        const stepLines = [];
        const stepHeight = hPx / Math.max(4, stepCount);
        for (let i = 1; i < stepCount; i++) {
          const y = i * stepHeight;
          if (y < hPx) {
            stepLines.push(
              <Line
                key={`step_${i}`}
                points={[0, y, wPx, y]}
                stroke="#64748b"
                strokeWidth={1 / zoom}
              />
            );
          }
        }

        return (
          <Group
            key={stair.id}
            x={stair.position.x * BASE_PIXELS_PER_UNIT}
            y={stair.position.y * BASE_PIXELS_PER_UNIT}
            rotation={stair.rotation}
            onClick={(e) => {
              e.cancelBubble = true;
              setSelectedEntity(stair.id, 'staircase');
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              setSelectedEntity(stair.id, 'staircase');
            }}
          >
            {/* Staircase Outer Boundary */}
            <Rect
              x={0}
              y={0}
              width={wPx}
              height={hPx}
              fill="#1e293b"
              opacity={0.4}
              stroke={isSelected ? '#38bdf8' : '#475569'}
              strokeWidth={(isSelected ? 2 : 1) / zoom}
              dash={isSelected ? [4 / zoom, 4 / zoom] : undefined}
            />

            {/* Step Lines */}
            {stepLines}

            {/* Flight Direction Arrow */}
            <Arrow
              points={
                direction === 'up'
                  ? [wPx / 2, hPx * 0.85, wPx / 2, hPx * 0.15]
                  : [wPx / 2, hPx * 0.15, wPx / 2, hPx * 0.85]
              }
              pointerLength={6 / zoom}
              pointerWidth={6 / zoom}
              fill="#38bdf8"
              stroke="#38bdf8"
              strokeWidth={1.5 / zoom}
            />

            {/* Label */}
            <Text
              x={0}
              y={hPx / 2 - 6 / zoom}
              text={`${stair.properties.staircaseType || 'Straight'} (${stepCount} Steps)`}
              fontSize={9 / zoom}
              fill="#f8fafc"
              fontStyle="bold"
              align="center"
              width={wPx}
            />
          </Group>
        );
      })}
    </Group>
  );
};
