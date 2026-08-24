import React from 'react';
import { Group, Line, Circle, Text } from 'react-konva';
import type { CompoundWallEntity } from '@vastuplan/shared';
import { useCanvasStore } from '../../stores/canvasStore';
import { useProjectStore } from '../../stores/projectStore';
import { useHistoryStore, createHistoryAction } from '../../stores/historyStore';
import { BASE_PIXELS_PER_UNIT } from '../../constants';
import { distanceBetweenPoints, calculateAngle } from '../../utils/geometry';

interface CompoundWallsLayerProps {
  compoundWalls: CompoundWallEntity[];
  zoom: number;
}

export const CompoundWallsLayer: React.FC<CompoundWallsLayerProps> = ({
  compoundWalls,
  zoom,
}) => {
  const { selectedEntityId, selectedEntityIds, setSelectedEntity } = useCanvasStore();
  const { updateEntity, currentProject } = useProjectStore();
  const pushHistory = useHistoryStore((s) => s.push);

  return (
    <Group id="compound-walls-layer">
      {compoundWalls.map((cw) => {
        if (!cw.visible) return null;

        const isSelected =
          selectedEntityId === cw.id || selectedEntityIds.includes(cw.id);
        const segments = cw.properties.segments || [];
        const thickness = (cw.properties.thickness || 0.75) * BASE_PIXELS_PER_UNIT;

        return (
          <Group key={cw.id}>
            {segments.map((seg, idx) => {
              const x1 = seg.startX * BASE_PIXELS_PER_UNIT;
              const y1 = seg.startY * BASE_PIXELS_PER_UNIT;
              const x2 = seg.endX * BASE_PIXELS_PER_UNIT;
              const y2 = seg.endY * BASE_PIXELS_PER_UNIT;

              const length = distanceBetweenPoints(
                { x: seg.startX, y: seg.startY },
                { x: seg.endX, y: seg.endY }
              );
              const angle = calculateAngle(
                { x: seg.startX, y: seg.startY },
                { x: seg.endX, y: seg.endY }
              );

              const handleDragEndpoint = (endpoint: 'start' | 'end', newX: number, newY: number) => {
                const updatedSegments = segments.map((s, i) => {
                  if (i !== idx) return s;
                  return endpoint === 'start'
                    ? { ...s, startX: newX, startY: newY }
                    : { ...s, endX: newX, endY: newY };
                });

                const before = [...(currentProject?.floors[0]?.entities || [])];
                updateEntity(cw.id, {
                  properties: { ...cw.properties, segments: updatedSegments },
                });
                const after = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
                pushHistory(
                  createHistoryAction('UPDATE_ENTITY', before, after, `Edit compound wall segment ${endpoint} endpoint`)
                );
              };

              return (
                <Group
                  key={seg.id || `seg_${idx}`}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    setSelectedEntity(cw.id, 'compound-wall');
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    setSelectedEntity(cw.id, 'compound-wall');
                  }}
                >
                  {/* Segment Line */}
                  <Line
                    points={[x1, y1, x2, y2]}
                    stroke={isSelected ? '#38bdf8' : '#a855f7'}
                    strokeWidth={thickness}
                    lineCap="square"
                    dash={[8 / zoom, 4 / zoom]}
                  />

                  {/* Segment Length Label */}
                  <Text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 12 / zoom}
                    text={`Boundary ${length.toFixed(1)}ft`}
                    fontSize={8 / zoom}
                    fill="#c084fc"
                    align="center"
                  />

                  {/* Interactive Endpoint Handles when Selected */}
                  {isSelected && (
                    <>
                      <Circle
                        x={x1}
                        y={y1}
                        radius={6 / zoom}
                        fill="#38bdf8"
                        stroke="#0f172a"
                        strokeWidth={1.5 / zoom}
                        draggable
                        onDragEnd={(e) => {
                          const newX = e.target.x() / BASE_PIXELS_PER_UNIT;
                          const newY = e.target.y() / BASE_PIXELS_PER_UNIT;
                          handleDragEndpoint('start', newX, newY);
                        }}
                      />
                      <Circle
                        x={x2}
                        y={y2}
                        radius={6 / zoom}
                        fill="#38bdf8"
                        stroke="#0f172a"
                        strokeWidth={1.5 / zoom}
                        draggable
                        onDragEnd={(e) => {
                          const newX = e.target.x() / BASE_PIXELS_PER_UNIT;
                          const newY = e.target.y() / BASE_PIXELS_PER_UNIT;
                          handleDragEndpoint('end', newX, newY);
                        }}
                      />
                    </>
                  )}
                </Group>
              );
            })}
          </Group>
        );
      })}
    </Group>
  );
};
