import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';
import type { WindowEntity } from '@vastuplan/shared';
import { useCanvasStore } from '../../stores/canvasStore';
import { BASE_PIXELS_PER_UNIT } from '../../constants';

interface WindowsLayerProps {
  windows: WindowEntity[];
  zoom: number;
}

export const WindowsLayer: React.FC<WindowsLayerProps> = ({ windows, zoom }) => {
  const { selectedEntityId, selectedEntityIds, setSelectedEntity } = useCanvasStore();

  return (
    <Group id="windows-layer">
      {windows.map((win) => {
        if (!win.visible) return null;

        const isSelected =
          selectedEntityId === win.id || selectedEntityIds.includes(win.id);
        const wPx = win.properties.width * BASE_PIXELS_PER_UNIT;
        const thickPx = 0.4 * BASE_PIXELS_PER_UNIT;

        return (
          <Group
            key={win.id}
            x={win.position.x * BASE_PIXELS_PER_UNIT}
            y={win.position.y * BASE_PIXELS_PER_UNIT}
            rotation={win.rotation}
            onClick={(e) => {
              e.cancelBubble = true;
              setSelectedEntity(win.id, 'window');
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              setSelectedEntity(win.id, 'window');
            }}
          >
            {/* Window Outer Frame */}
            <Rect
              x={-wPx / 2}
              y={-thickPx / 2}
              width={wPx}
              height={thickPx}
              fill="#0284c7"
              opacity={0.3}
              stroke="#38bdf8"
              strokeWidth={1.5 / zoom}
            />

            {/* Selection Highlight */}
            {isSelected && (
              <Rect
                x={-wPx / 2 - 2}
                y={-thickPx / 2 - 2}
                width={wPx + 4}
                height={thickPx + 4}
                stroke="#38bdf8"
                strokeWidth={1.5 / zoom}
                dash={[4 / zoom, 4 / zoom]}
              />
            )}

            {/* Glass Pane Double Lines */}
            <Line
              points={[-wPx / 2, -thickPx / 6, wPx / 2, -thickPx / 6]}
              stroke="#e0f2fe"
              strokeWidth={1 / zoom}
            />
            <Line
              points={[-wPx / 2, thickPx / 6, wPx / 2, thickPx / 6]}
              stroke="#e0f2fe"
              strokeWidth={1 / zoom}
            />

            {/* Window Sills */}
            <Line
              points={[-wPx / 2 - 2, -thickPx / 2, -wPx / 2 - 2, thickPx / 2]}
              stroke="#38bdf8"
              strokeWidth={2 / zoom}
            />
            <Line
              points={[wPx / 2 + 2, -thickPx / 2, wPx / 2 + 2, thickPx / 2]}
              stroke="#38bdf8"
              strokeWidth={2 / zoom}
            />

            {/* Label */}
            <Text
              x={-wPx / 2}
              y={thickPx * 0.8}
              text={`Win (${win.properties.width}ft)`}
              fontSize={7.5 / zoom}
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
