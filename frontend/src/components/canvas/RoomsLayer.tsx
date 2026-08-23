import React, { useRef, useEffect } from 'react';
import { Group, Rect, Text, Transformer } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type Konva from 'konva';
import type { RoomEntity } from '@vastuplan/shared';
import { BASE_PIXELS_PER_UNIT } from '../../constants';
import { useCanvasStore } from '../../stores/canvasStore';
import { useProjectStore } from '../../stores/projectStore';
import { useHistoryStore, createHistoryAction } from '../../stores/historyStore';
import { calculateRectangleArea } from '../../utils/geometry';

interface RoomsLayerProps {
  rooms: RoomEntity[];
  selectedEntityIds: string[];
  unit: string;
}

export const RoomsLayer: React.FC<RoomsLayerProps> = ({ rooms, selectedEntityIds, unit }) => {
  const zoom = useCanvasStore((s) => s.zoom);
  const setSelectedEntity = useCanvasStore((s) => s.setSelectedEntity);
  const toggleSelectEntity = useCanvasStore((s) => s.toggleSelectEntity);

  const { updateEntity, currentProject } = useProjectStore();
  const pushHistory = useHistoryStore((s) => s.push);

  const transformerRef = useRef<Konva.Transformer>(null);
  const selectedNodesRef = useRef<Map<string, Konva.Node>>(new Map());

  const unitLabel = unit === 'feet' ? 'ft' : 'm';
  const areaUnit = unit === 'feet' ? 'sq.ft' : 'm²';

  // ── Attach Transformer to selected room nodes ──
  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;

    const nodes: Konva.Node[] = [];
    selectedEntityIds.forEach((id) => {
      const node = selectedNodesRef.current.get(id);
      if (node) nodes.push(node);
    });

    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedEntityIds, rooms]);

  // ── Drag room ──
  const handleDragEnd = (e: KonvaEventObject<DragEvent>, room: RoomEntity) => {
    const newX = parseFloat((e.target.x() / BASE_PIXELS_PER_UNIT).toFixed(2));
    const newY = parseFloat((e.target.y() / BASE_PIXELS_PER_UNIT).toFixed(2));

    const entitiesBefore = [...(currentProject?.floors[0]?.entities || [])];

    updateEntity(room.id, {
      position: { x: newX, y: newY },
    });

    const entitiesAfter = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
    pushHistory(
      createHistoryAction('MOVE_ENTITY', entitiesBefore, entitiesAfter, `Move room ${room.properties.name}`)
    );
  };

  // ── Transform (Resize / Rotate) ──
  const handleTransformEnd = (e: KonvaEventObject<Event>, room: RoomEntity) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset node scale so world width/height is stored explicitly
    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(1, parseFloat(((room.dimensions.width * scaleX)).toFixed(2)));
    const newHeight = Math.max(1, parseFloat(((room.dimensions.height * scaleY)).toFixed(2)));
    const newX = parseFloat((node.x() / BASE_PIXELS_PER_UNIT).toFixed(2));
    const newY = parseFloat((node.y() / BASE_PIXELS_PER_UNIT).toFixed(2));
    const newRotation = Math.round(node.rotation());

    const entitiesBefore = [...(currentProject?.floors[0]?.entities || [])];

    updateEntity(room.id, {
      position: { x: newX, y: newY },
      dimensions: { width: newWidth, height: newHeight },
      rotation: newRotation,
    });

    const entitiesAfter = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
    pushHistory(
      createHistoryAction('RESIZE_ENTITY', entitiesBefore, entitiesAfter, `Resize room ${room.properties.name}`)
    );
  };

  return (
    <Group>
      {rooms.map((room) => {
        const isSelected = selectedEntityIds.includes(room.id);

        const rx = room.position.x * BASE_PIXELS_PER_UNIT;
        const ry = room.position.y * BASE_PIXELS_PER_UNIT;
        const rw = room.dimensions.width * BASE_PIXELS_PER_UNIT;
        const rh = room.dimensions.height * BASE_PIXELS_PER_UNIT;
        const area = calculateRectangleArea(room.dimensions.width, room.dimensions.height);

        // Adaptive typography
        const nameFontSize = Math.max(9, Math.min(14, 12 / zoom));
        const subFontSize = Math.max(7, Math.min(11, 9.5 / zoom));

        return (
          <Group
            key={room.id}
            id={room.id}
            x={rx}
            y={ry}
            rotation={room.rotation || 0}
            draggable={isSelected}
            ref={(node) => {
              if (node) selectedNodesRef.current.set(room.id, node);
              else selectedNodesRef.current.delete(room.id);
            }}
            onClick={(e) => {
              e.cancelBubble = true;
              if (e.evt.shiftKey) {
                toggleSelectEntity(room.id, 'room');
              } else {
                setSelectedEntity(room.id, 'room');
              }
            }}
            onDragEnd={(e) => handleDragEnd(e, room)}
            onTransformEnd={(e) => handleTransformEnd(e, room)}
          >
            {/* Room background fill */}
            <Rect
              x={0}
              y={0}
              width={rw}
              height={rh}
              fill={isSelected ? 'rgba(77, 100, 255, 0.12)' : 'rgba(59, 130, 246, 0.06)'}
              stroke={isSelected ? '#4d64ff' : '#3b82f6'}
              strokeWidth={(isSelected ? 1.5 : 1) / zoom}
              dash={isSelected ? undefined : [4 / zoom, 2 / zoom]}
              cornerRadius={2 / zoom}
            />

            {/* Room title & area label */}
            <Text
              x={0}
              y={rh / 2 - 12 / zoom}
              width={rw}
              text={room.properties.name || 'Room'}
              fontSize={nameFontSize}
              fontFamily="Inter, sans-serif"
              fontWeight="600"
              fill={isSelected ? '#ffffff' : '#dbeafe'}
              align="center"
              listening={false}
            />
            <Text
              x={0}
              y={rh / 2 + 3 / zoom}
              width={rw}
              text={`${room.dimensions.width.toFixed(1)} × ${room.dimensions.height.toFixed(1)} ${unitLabel}\n${area.toFixed(0)} ${areaUnit}`}
              fontSize={subFontSize}
              fontFamily="'JetBrains Mono', monospace"
              fill={isSelected ? '#93c5fd' : '#94a3b8'}
              align="center"
              listening={false}
            />
          </Group>
        );
      })}

      {/* Konva Transformer for Room resizing */}
      <Transformer
        ref={transformerRef}
        rotateEnabled={true}
        enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
        boundBoxFunc={(oldBox, newBox) => {
          // Minimum 10px size on screen
          if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
            return oldBox;
          }
          return newBox;
        }}
        anchorFill="#4d64ff"
        anchorStroke="#ffffff"
        anchorSize={7 / zoom}
        anchorCornerRadius={1.5}
        borderStroke="#4d64ff"
        borderStrokeWidth={1 / zoom}
        borderDash={[3 / zoom, 3 / zoom]}
      />
    </Group>
  );
};
