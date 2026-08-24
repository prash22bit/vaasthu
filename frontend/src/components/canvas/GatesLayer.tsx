import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';
import type { GateEntity } from '@vastuplan/shared';
import { useCanvasStore } from '../../stores/canvasStore';
import { BASE_PIXELS_PER_UNIT } from '../../constants';

interface GatesLayerProps {
  gates: GateEntity[];
  zoom: number;
}

export const GatesLayer: React.FC<GatesLayerProps> = ({ gates, zoom }) => {
  const { selectedEntityId, selectedEntityIds, setSelectedEntity } = useCanvasStore();

  return (
    <Group id="gates-layer">
      {gates.map((gate) => {
        if (!gate.visible) return null;

        const isSelected =
          selectedEntityId === gate.id || selectedEntityIds.includes(gate.id);
        const wPx = gate.properties.width * BASE_PIXELS_PER_UNIT;
        const thickPx = 0.5 * BASE_PIXELS_PER_UNIT;

        return (
          <Group
            key={gate.id}
            x={gate.position.x * BASE_PIXELS_PER_UNIT}
            y={gate.position.y * BASE_PIXELS_PER_UNIT}
            rotation={gate.rotation}
            onClick={(e) => {
              e.cancelBubble = true;
              setSelectedEntity(gate.id, 'gate');
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              setSelectedEntity(gate.id, 'gate');
            }}
          >
            {/* Gate Opening Area */}
            <Rect
              x={-wPx / 2}
              y={-thickPx / 2}
              width={wPx}
              height={thickPx}
              fill="#0f172a"
              opacity={0.8}
              stroke={isSelected ? '#38bdf8' : '#a855f7'}
              strokeWidth={(isSelected ? 2 : 1.5) / zoom}
              dash={isSelected ? [4 / zoom, 4 / zoom] : undefined}
            />

            {/* Gate Pillars */}
            <Rect
              x={-wPx / 2 - thickPx}
              y={-thickPx}
              width={thickPx}
              height={thickPx * 2}
              fill="#a855f7"
              stroke="#0f172a"
              strokeWidth={1 / zoom}
            />
            <Rect
              x={wPx / 2}
              y={-thickPx}
              width={thickPx}
              height={thickPx * 2}
              fill="#a855f7"
              stroke="#0f172a"
              strokeWidth={1 / zoom}
            />

            {/* Gate Bars */}
            <Line
              points={[-wPx / 2, 0, wPx / 2, 0]}
              stroke="#e9d5ff"
              strokeWidth={2 / zoom}
            />

            {/* Label */}
            <Text
              x={-wPx / 2}
              y={thickPx * 1.5}
              text={`MAIN GATE (${gate.properties.width}ft)`}
              fontSize={8 / zoom}
              fill="#d8b4fe"
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
