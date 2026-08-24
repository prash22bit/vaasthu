import React from 'react';
import { Group, Rect, Line, Arc, Text } from 'react-konva';
import type { DoorEntity } from '@vastuplan/shared';
import { useCanvasStore } from '../../stores/canvasStore';
import { BASE_PIXELS_PER_UNIT } from '../../constants';

interface DoorsLayerProps {
  doors: DoorEntity[];
  zoom: number;
}

export const DoorsLayer: React.FC<DoorsLayerProps> = ({ doors, zoom }) => {
  const { selectedEntityId, selectedEntityIds, setSelectedEntity } = useCanvasStore();

  return (
    <Group id="doors-layer">
      {doors.map((door) => {
        if (!door.visible) return null;

        const isSelected =
          selectedEntityId === door.id || selectedEntityIds.includes(door.id);
        const wPx = door.properties.width * BASE_PIXELS_PER_UNIT;
        const panelThickPx = 0.15 * BASE_PIXELS_PER_UNIT;

        const swingDir = door.properties.swingDirection || 'left';
        const swingOrient = door.properties.swingOrientation || 'inward';
        const isDouble = door.properties.doorType === 'double';
        const isSliding = door.properties.doorType === 'sliding';

        const swingAngle = swingOrient === 'inward' ? 90 : -90;
        const startAngle = swingDir === 'left' ? 0 : 90;

        return (
          <Group
            key={door.id}
            x={door.position.x * BASE_PIXELS_PER_UNIT}
            y={door.position.y * BASE_PIXELS_PER_UNIT}
            rotation={door.rotation}
            onClick={(e) => {
              e.cancelBubble = true;
              setSelectedEntity(door.id, 'door');
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              setSelectedEntity(door.id, 'door');
            }}
          >
            {/* Opening gap backdrop */}
            <Rect
              x={-wPx / 2}
              y={-panelThickPx}
              width={wPx}
              height={panelThickPx * 2}
              fill="#0f172a"
              opacity={0.8}
            />

            {/* Selection Highlight */}
            {isSelected && (
              <Rect
                x={-wPx / 2 - 2}
                y={-panelThickPx * 2}
                width={wPx + 4}
                height={panelThickPx * 4}
                stroke="#38bdf8"
                strokeWidth={1.5 / zoom}
                dash={[4 / zoom, 4 / zoom]}
              />
            )}

            {isSliding ? (
              /* Sliding Door Panels */
              <Group>
                <Rect
                  x={-wPx / 2}
                  y={-panelThickPx}
                  width={wPx / 2}
                  height={panelThickPx}
                  fill="#38bdf8"
                  stroke="#0284c7"
                  strokeWidth={1 / zoom}
                />
                <Rect
                  x={0}
                  y={0}
                  width={wPx / 2}
                  height={panelThickPx}
                  fill="#38bdf8"
                  stroke="#0284c7"
                  strokeWidth={1 / zoom}
                />
              </Group>
            ) : isDouble ? (
              /* Double Swing Doors */
              <Group>
                {/* Left leaf */}
                <Line
                  points={[-wPx / 2, 0, -wPx / 2, swingOrient === 'inward' ? wPx / 2 : -wPx / 2]}
                  stroke="#38bdf8"
                  strokeWidth={2 / zoom}
                />
                <Arc
                  x={-wPx / 2}
                  y={0}
                  innerRadius={wPx / 2}
                  outerRadius={wPx / 2}
                  angle={90}
                  rotation={swingOrient === 'inward' ? 0 : -90}
                  stroke="#0284c7"
                  strokeWidth={1 / zoom}
                  dash={[3 / zoom, 3 / zoom]}
                />

                {/* Right leaf */}
                <Line
                  points={[wPx / 2, 0, wPx / 2, swingOrient === 'inward' ? wPx / 2 : -wPx / 2]}
                  stroke="#38bdf8"
                  strokeWidth={2 / zoom}
                />
                <Arc
                  x={wPx / 2}
                  y={0}
                  innerRadius={wPx / 2}
                  outerRadius={wPx / 2}
                  angle={90}
                  rotation={swingOrient === 'inward' ? 90 : 180}
                  stroke="#0284c7"
                  strokeWidth={1 / zoom}
                  dash={[3 / zoom, 3 / zoom]}
                />
              </Group>
            ) : (
              /* Single Swing Door */
              <Group>
                {/* Hinge & Door Panel Leaf */}
                <Line
                  points={[
                    swingDir === 'left' ? -wPx / 2 : wPx / 2,
                    0,
                    swingDir === 'left' ? -wPx / 2 : wPx / 2,
                    swingOrient === 'inward' ? wPx : -wPx,
                  ]}
                  stroke="#38bdf8"
                  strokeWidth={2.5 / zoom}
                />
                {/* Swing Arc */}
                <Arc
                  x={swingDir === 'left' ? -wPx / 2 : wPx / 2}
                  y={0}
                  innerRadius={wPx}
                  outerRadius={wPx}
                  angle={90}
                  rotation={
                    swingDir === 'left'
                      ? swingOrient === 'inward'
                        ? 0
                        : -90
                      : swingOrient === 'inward'
                      ? 90
                      : 180
                  }
                  stroke="#0284c7"
                  strokeWidth={1 / zoom}
                  dash={[3 / zoom, 3 / zoom]}
                />
              </Group>
            )}

            {/* Label */}
            <Text
              x={-wPx / 2}
              y={panelThickPx * 2.5}
              text={`Door (${door.properties.width}ft)`}
              fontSize={8 / zoom}
              fill="#94a3b8"
              align="center"
              width={wPx}
            />
          </Group>
        );
      })}
    </Group>
  );
};
