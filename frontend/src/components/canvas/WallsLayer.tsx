import React from 'react';
import { Group, Rect, Circle, Text, Line } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { WallEntity, WorldPoint } from '@vastuplan/shared';
import { BASE_PIXELS_PER_UNIT } from '../../constants';
import { distanceBetweenPoints, calculateAngle } from '../../utils/geometry';
import { useCanvasStore } from '../../stores/canvasStore';
import { useProjectStore } from '../../stores/projectStore';
import { useHistoryStore, createHistoryAction } from '../../stores/historyStore';
import { getSnapPoint } from '../../utils/snapping';

interface WallsLayerProps {
  walls: WallEntity[];
  selectedEntityIds: string[];
  unit: string;
}

export const WallsLayer: React.FC<WallsLayerProps> = ({ walls, selectedEntityIds, unit }) => {
  const zoom = useCanvasStore((s) => s.zoom);
  const grid = useCanvasStore((s) => s.grid);
  const setSelectedEntity = useCanvasStore((s) => s.setSelectedEntity);
  const toggleSelectEntity = useCanvasStore((s) => s.toggleSelectEntity);
  const setSnapResult = useCanvasStore((s) => s.setSnapResult);

  const { updateEntity, currentProject } = useProjectStore();
  const pushHistory = useHistoryStore((s) => s.push);

  const unitLabel = unit === 'feet' ? 'ft' : 'm';

  // ── Dragging endpoint ──
  const handleEndpointDragMove = (
    e: KonvaEventObject<DragEvent>,
    wall: WallEntity,
    handleType: 'start' | 'end'
  ) => {
    e.cancelBubble = true;
    const stage = e.target.getStage();
    if (!stage || !currentProject) return;

    const stagePos = stage.getPointerPosition();
    if (!stagePos) return;

    // Convert screen pointer to world point
    const { panX, panY } = useCanvasStore.getState();
    const rawWorldPoint: WorldPoint = {
      x: (stagePos.x - panX) / (BASE_PIXELS_PER_UNIT * zoom),
      y: (stagePos.y - panY) / (BASE_PIXELS_PER_UNIT * zoom),
    };

    // Apply snapping engine
    const snap = getSnapPoint(
      rawWorldPoint,
      currentProject.floors[0]?.entities || [],
      {
        threshold: 1.0 / zoom,
        gridSnapEnabled: grid.snapToGrid,
        cellSize: grid.cellSize,
        ignoreEntityIds: [wall.id],
      }
    );
    setSnapResult(snap);

    const newPoint = snap.point;
    const newProps = { ...wall.properties };

    if (handleType === 'start') {
      newProps.startX = newPoint.x;
      newProps.startY = newPoint.y;
    } else {
      newProps.endX = newPoint.x;
      newProps.endY = newPoint.y;
    }

    const newLength = distanceBetweenPoints(
      { x: newProps.startX, y: newProps.startY },
      { x: newProps.endX, y: newProps.endY }
    );
    const newAngle = calculateAngle(
      { x: newProps.startX, y: newProps.startY },
      { x: newProps.endX, y: newProps.endY }
    );

    updateEntity(wall.id, {
      position: { x: newProps.startX, y: newProps.startY },
      dimensions: { width: newLength, height: newProps.thickness },
      rotation: newAngle,
      properties: newProps,
    });
  };

  const handleEndpointDragEnd = (wall: WallEntity) => {
    setSnapResult(null);
    if (!currentProject) return;

    const entitiesAfter = [...(currentProject.floors[0]?.entities || [])];
    pushHistory(
      createHistoryAction('MOVE_ENTITY', [], entitiesAfter, `Move wall endpoint`)
    );
  };

  // ── Dragging wall body ──
  const dragStartPos = React.useRef<{ startX: number; startY: number; endX: number; endY: number } | null>(null);

  const handleWallDragStart = (wall: WallEntity) => {
    dragStartPos.current = {
      startX: wall.properties.startX,
      startY: wall.properties.startY,
      endX: wall.properties.endX,
      endY: wall.properties.endY,
    };
  };

  const handleWallDragMove = (e: KonvaEventObject<DragEvent>, wall: WallEntity) => {
    const stage = e.target.getStage();
    if (!stage || !dragStartPos.current || !currentProject) return;

    // Movement delta in screen pixels converted to world units
    const dx = e.target.x() / BASE_PIXELS_PER_UNIT - dragStartPos.current.startX;
    const dy = e.target.y() / BASE_PIXELS_PER_UNIT - dragStartPos.current.startY;

    const newProps = {
      ...wall.properties,
      startX: dragStartPos.current.startX + dx,
      startY: dragStartPos.current.startY + dy,
      endX: dragStartPos.current.endX + dx,
      endY: dragStartPos.current.endY + dy,
    };

    updateEntity(wall.id, {
      position: { x: newProps.startX, y: newProps.startY },
      properties: newProps,
    });
  };

  const handleWallDragEnd = (wall: WallEntity) => {
    dragStartPos.current = null;
    if (!currentProject) return;

    const entitiesAfter = [...(currentProject.floors[0]?.entities || [])];
    pushHistory(
      createHistoryAction('MOVE_ENTITY', [], entitiesAfter, `Move wall`)
    );
  };

  return (
    <Group>
      {walls.map((wall) => {
        const isSelected = selectedEntityIds.includes(wall.id);

        const p1 = { x: wall.properties.startX, y: wall.properties.startY };
        const p2 = { x: wall.properties.endX, y: wall.properties.endY };
        const length = distanceBetweenPoints(p1, p2);
        const angle = calculateAngle(p1, p2);
        const thickness = wall.properties.thickness || 0.375;

        // Coordinates in world pixels (before stage zoom transform)
        const sx = p1.x * BASE_PIXELS_PER_UNIT;
        const sy = p1.y * BASE_PIXELS_PER_UNIT;
        const ex = p2.x * BASE_PIXELS_PER_UNIT;
        const ey = p2.y * BASE_PIXELS_PER_UNIT;
        const wallW = length * BASE_PIXELS_PER_UNIT;
        const wallH = thickness * BASE_PIXELS_PER_UNIT;

        return (
          <Group key={wall.id}>
            {/* Wall Body Rect */}
            <Group
              x={sx}
              y={sy}
              rotation={angle}
              draggable={isSelected}
              onDragStart={() => handleWallDragStart(wall)}
              onDragMove={(e) => handleWallDragMove(e, wall)}
              onDragEnd={() => handleWallDragEnd(wall)}
              onClick={(e) => {
                e.cancelBubble = true;
                if (e.evt.shiftKey) {
                  toggleSelectEntity(wall.id, 'wall');
                } else {
                  setSelectedEntity(wall.id, 'wall');
                }
              }}
            >
              <Rect
                x={0}
                y={-wallH / 2}
                width={wallW}
                height={wallH}
                fill={isSelected ? '#4d64ff' : '#6b7590'}
                stroke={isSelected ? '#3b42cc' : '#4a526b'}
                strokeWidth={1 / zoom}
                cornerRadius={1 / zoom}
                shadowColor={isSelected ? '#4d64ff' : undefined}
                shadowBlur={isSelected ? 6 / zoom : 0}
                shadowOpacity={isSelected ? 0.4 : 0}
              />

              {/* Length label overlay */}
              <Text
                x={wallW / 2}
                y={-wallH / 2 - 12 / zoom}
                text={`${length.toFixed(1)} ${unitLabel}`}
                fontSize={10 / zoom}
                fill={isSelected ? '#8b9dff' : '#9ea7c1'}
                align="center"
                offsetX={20 / zoom}
                fontFamily="'JetBrains Mono', monospace"
                listening={false}
              />
            </Group>

            {/* Endpoint Drag Handles (rendered when selected) */}
            {isSelected && (
              <>
                {/* Start handle */}
                <Circle
                  x={sx}
                  y={sy}
                  radius={5 / zoom}
                  fill="#ffffff"
                  stroke="#4d64ff"
                  strokeWidth={2 / zoom}
                  draggable
                  onDragMove={(e) => handleEndpointDragMove(e, wall, 'start')}
                  onDragEnd={() => handleEndpointDragEnd(wall)}
                />
                {/* End handle */}
                <Circle
                  x={ex}
                  y={ey}
                  radius={5 / zoom}
                  fill="#ffffff"
                  stroke="#4d64ff"
                  strokeWidth={2 / zoom}
                  draggable
                  onDragMove={(e) => handleEndpointDragMove(e, wall, 'end')}
                  onDragEnd={() => handleEndpointDragEnd(wall)}
                />
              </>
            )}
          </Group>
        );
      })}
    </Group>
  );
};
