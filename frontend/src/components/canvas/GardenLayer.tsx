import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import type { GardenEntity } from '@vastuplan/shared';
import { useCanvasStore } from '../../stores/canvasStore';
import { BASE_PIXELS_PER_UNIT } from '../../constants';

interface GardenLayerProps {
  gardens: GardenEntity[];
  zoom: number;
}

export const GardenLayer: React.FC<GardenLayerProps> = ({ gardens, zoom }) => {
  const { selectedEntityId, selectedEntityIds, setSelectedEntity } = useCanvasStore();

  return (
    <Group id="garden-layer">
      {gardens.map((g) => {
        if (!g.visible) return null;

        const isSelected =
          selectedEntityId === g.id || selectedEntityIds.includes(g.id);
        const wPx = g.dimensions.width * BASE_PIXELS_PER_UNIT;
        const hPx = g.dimensions.height * BASE_PIXELS_PER_UNIT;
        const typeLabel = (g.properties.gardenType || 'Garden').toUpperCase();

        return (
          <Group
            key={g.id}
            x={g.position.x * BASE_PIXELS_PER_UNIT}
            y={g.position.y * BASE_PIXELS_PER_UNIT}
            rotation={g.rotation}
            onClick={(e) => {
              e.cancelBubble = true;
              setSelectedEntity(g.id, 'garden');
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              setSelectedEntity(g.id, 'garden');
            }}
          >
            {/* Garden Fill Area */}
            <Rect
              x={0}
              y={0}
              width={wPx}
              height={hPx}
              fill="#14532d"
              opacity={0.35}
              stroke={isSelected ? '#38bdf8' : '#22c55e'}
              strokeWidth={(isSelected ? 2 : 1.5) / zoom}
              dash={isSelected ? [4 / zoom, 4 / zoom] : [6 / zoom, 3 / zoom]}
            />

            {/* Label */}
            <Text
              x={0}
              y={hPx / 2 - 6 / zoom}
              text={`🌿 ${typeLabel}`}
              fontSize={10 / zoom}
              fill="#86efac"
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
