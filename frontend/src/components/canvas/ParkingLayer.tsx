import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';
import type { ParkingEntity } from '@vastuplan/shared';
import { useCanvasStore } from '../../stores/canvasStore';
import { BASE_PIXELS_PER_UNIT } from '../../constants';

interface ParkingLayerProps {
  parkingSpaces: ParkingEntity[];
  zoom: number;
}

export const ParkingLayer: React.FC<ParkingLayerProps> = ({ parkingSpaces, zoom }) => {
  const { selectedEntityId, selectedEntityIds, setSelectedEntity } = useCanvasStore();

  return (
    <Group id="parking-layer">
      {parkingSpaces.map((parking) => {
        if (!parking.visible) return null;

        const isSelected =
          selectedEntityId === parking.id || selectedEntityIds.includes(parking.id);
        const wPx = parking.dimensions.width * BASE_PIXELS_PER_UNIT;
        const hPx = parking.dimensions.height * BASE_PIXELS_PER_UNIT;
        const count = parking.properties.vehicleCount || 2;
        const type = parking.properties.parkingType || 'car';

        const bayWidth = wPx / Math.max(1, count);
        const dividers = [];

        for (let i = 1; i < count; i++) {
          const x = i * bayWidth;
          dividers.push(
            <Line
              key={`bay_${i}`}
              points={[x, 0, x, hPx]}
              stroke="#fbbf24"
              strokeWidth={1.5 / zoom}
              dash={[6 / zoom, 4 / zoom]}
            />
          );
        }

        return (
          <Group
            key={parking.id}
            x={parking.position.x * BASE_PIXELS_PER_UNIT}
            y={parking.position.y * BASE_PIXELS_PER_UNIT}
            rotation={parking.rotation}
            onClick={(e) => {
              e.cancelBubble = true;
              setSelectedEntity(parking.id, 'parking');
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              setSelectedEntity(parking.id, 'parking');
            }}
          >
            {/* Parking Lot Area */}
            <Rect
              x={0}
              y={0}
              width={wPx}
              height={hPx}
              fill="#1e293b"
              opacity={0.6}
              stroke={isSelected ? '#38bdf8' : '#eab308'}
              strokeWidth={(isSelected ? 2 : 1.5) / zoom}
              dash={isSelected ? [4 / zoom, 4 / zoom] : undefined}
            />

            {/* Parking Dividers */}
            {dividers}

            {/* Parking Symbol Label */}
            <Text
              x={0}
              y={hPx / 2 - 8 / zoom}
              text={`PARKING (${count} ${type.toUpperCase()})`}
              fontSize={10 / zoom}
              fill="#fef08a"
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
