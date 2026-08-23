import React, { useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Line, Text, Group } from 'react-konva';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type {
  Project,
  WorldPoint,
  DesignEntity,
  WallEntity,
  RoomEntity,
  DimensionEntity,
} from '@vastuplan/shared';
import { useCanvasStore } from '../../stores/canvasStore';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { useHistoryStore, createHistoryAction } from '../../stores/historyStore';
import { GridLayer } from './GridLayer';
import { PlotLayer } from './PlotLayer';
import { WallsLayer } from './WallsLayer';
import { RoomsLayer } from './RoomsLayer';
import { DimensionsLayer } from './DimensionsLayer';
import { SnapIndicatorLayer } from './SnapIndicatorLayer';
import { CompassWidget } from './CompassWidget';
import { BASE_PIXELS_PER_UNIT } from '../../constants';
import { getSnapPoint } from '../../utils/snapping';
import { distanceBetweenPoints, calculateAngle, snapAngle } from '../../utils/geometry';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

interface DesignCanvasProps {
  project: Project;
}

export const DesignCanvas: React.FC<DesignCanvasProps> = ({ project }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const {
    zoom,
    panX,
    panY,
    grid,
    canvasWidth,
    canvasHeight,
    isPanning,
    setPan,
    zoomIn,
    zoomOut,
    zoomToPoint,
    setIsPanning,
    setCanvasSize,
    selectedEntityId,
    selectedEntityIds,
    setSelectedEntity,
    clearSelection,
    fitToPlot,
    drawingState,
    setDrawingState,
    setSnapResult,
  } = useCanvasStore();

  const { activeTool, setActiveTool } = useUIStore();
  const { addEntity } = useProjectStore();
  const pushHistory = useHistoryStore((s) => s.push);

  const floor = project.floors[0] || { entities: [] };
  const entities = floor.entities || [];

  const walls = entities.filter((e) => e.type === 'wall') as WallEntity[];
  const rooms = entities.filter((e) => e.type === 'room') as RoomEntity[];
  const dimensions = entities.filter((e) => e.type === 'dimension') as DimensionEntity[];

  // Counter for default room naming
  const roomCountRef = useRef<number>(rooms.length + 1);

  // ── Resize Observer ────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize(width, height);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [setCanvasSize]);

  // ── Initial fit ────────────────────────────────────────────────────────────
  useEffect(() => {
    fitToPlot(project.plot.width, project.plot.length);
  }, [project.id]);

  // ── Mouse wheel zoom ───────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      zoomToPoint(pointer.x, pointer.y, e.evt.deltaY);
    },
    [zoomToPoint]
  );

  // ── Panning & Mouse interactions ───────────────────────────────────────────
  const lastPanPos = useRef<{ x: number; y: number } | null>(null);

  const getWorldPointFromStage = useCallback(
    (stage: Konva.Stage): WorldPoint | null => {
      const pos = stage.getPointerPosition();
      if (!pos) return null;
      return {
        x: (pos.x - panX) / (BASE_PIXELS_PER_UNIT * zoom),
        y: (pos.y - panY) / (BASE_PIXELS_PER_UNIT * zoom),
      };
    },
    [panX, panY, zoom]
  );

  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const isMiddleButton = e.evt.button === 1;
      const isRightButton = e.evt.button === 2;
      const stage = stageRef.current;
      if (!stage) return;

      // Right click or Esc cancels drawing
      if (isRightButton) {
        if (drawingState.isDrawing) {
          setDrawingState({ isDrawing: false, startPoint: null, currentPoint: null });
        }
        return;
      }

      // Middle button or Pan tool
      if (isMiddleButton || activeTool === 'pan') {
        e.evt.preventDefault();
        setIsPanning(true);
        lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
        return;
      }

      // CAD Drawing Tools: Wall, Room, Dimension
      if (activeTool === 'wall' || activeTool === 'room' || activeTool === 'dimension') {
        const rawWorld = getWorldPointFromStage(stage);
        if (!rawWorld) return;

        const snap = getSnapPoint(rawWorld, entities, {
          threshold: 1.0 / zoom,
          gridSnapEnabled: grid.snapToGrid,
          cellSize: grid.cellSize,
        });

        if (!drawingState.isDrawing) {
          // Click 1: Set start point
          setDrawingState({
            isDrawing: true,
            startPoint: snap.point,
            currentPoint: snap.point,
          });
        } else if (drawingState.startPoint) {
          // Click 2: Commit entity creation
          const startP = drawingState.startPoint;
          let endP = snap.point;

          // Apply angle snapping for Wall
          if (activeTool === 'wall') {
            const rawAngle = calculateAngle(startP, endP);
            const snappedAng = snapAngle(rawAngle, 45, 6);
            if (snappedAng !== rawAngle) {
              const dist = distanceBetweenPoints(startP, endP);
              const rad = (snappedAng * Math.PI) / 180;
              endP = {
                x: startP.x + Math.cos(rad) * dist,
                y: startP.y + Math.sin(rad) * dist,
              };
            }
          }

          const entitiesBefore = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];

          if (activeTool === 'wall') {
            const length = distanceBetweenPoints(startP, endP);
            if (length > 0.2) {
              const newWall: WallEntity = {
                id: `wall_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                type: 'wall',
                position: { x: startP.x, y: startP.y },
                dimensions: { width: length, height: 0.375 },
                rotation: calculateAngle(startP, endP),
                floorIndex: 0,
                locked: false,
                visible: true,
                properties: {
                  startX: startP.x,
                  startY: startP.y,
                  endX: endP.x,
                  endY: endP.y,
                  thickness: 0.375, // 4.5 inches = 0.375 ft default
                },
              };
              addEntity(newWall);
              setSelectedEntity(newWall.id, 'wall');

              const entitiesAfter = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
              pushHistory(
                createHistoryAction('CREATE_ENTITY', entitiesBefore, entitiesAfter, `Create Wall (${length.toFixed(1)} ${project.plot.unit === 'feet' ? 'ft' : 'm'})`)
              );
            }
          } else if (activeTool === 'room') {
            const rx = Math.min(startP.x, endP.x);
            const ry = Math.min(startP.y, endP.y);
            const rw = Math.abs(endP.x - startP.x);
            const rh = Math.abs(endP.y - startP.y);

            if (rw > 0.5 && rh > 0.5) {
              const roomName = `Room ${roomCountRef.current++}`;
              const newRoom: RoomEntity = {
                id: `room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                type: 'room',
                position: { x: rx, y: ry },
                dimensions: { width: rw, height: rh },
                rotation: 0,
                floorIndex: 0,
                locked: false,
                visible: true,
                properties: {
                  name: roomName,
                },
              };
              addEntity(newRoom);
              setSelectedEntity(newRoom.id, 'room');

              const entitiesAfter = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
              pushHistory(
                createHistoryAction('CREATE_ENTITY', entitiesBefore, entitiesAfter, `Create ${roomName}`)
              );
            }
          } else if (activeTool === 'dimension') {
            const length = distanceBetweenPoints(startP, endP);
            if (length > 0.2) {
              const newDim: DimensionEntity = {
                id: `dim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                type: 'dimension',
                position: { x: startP.x, y: startP.y },
                dimensions: { width: length, height: 1 },
                rotation: calculateAngle(startP, endP),
                floorIndex: 0,
                locked: false,
                visible: true,
                properties: {
                  startX: startP.x,
                  startY: startP.y,
                  endX: endP.x,
                  endY: endP.y,
                  associatedEntityId: snap.targetEntityId,
                  offset: 1.5,
                },
              };
              addEntity(newDim);
              setSelectedEntity(newDim.id, 'dimension');

              const entitiesAfter = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
              pushHistory(
                createHistoryAction('CREATE_ENTITY', entitiesBefore, entitiesAfter, `Create Dimension`)
              );
            }
          }

          // Reset drawing state and return to select tool
          setDrawingState({ isDrawing: false, startPoint: null, currentPoint: null });
          setSnapResult(null);
          setActiveTool('select');
        }
      }
    },
    [
      activeTool,
      drawingState,
      entities,
      zoom,
      grid,
      project.plot.unit,
      getWorldPointFromStage,
      setDrawingState,
      setIsPanning,
      addEntity,
      setSelectedEntity,
      setActiveTool,
      setSnapResult,
      pushHistory,
    ]
  );

  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (isPanning && lastPanPos.current) {
        const dx = e.evt.clientX - lastPanPos.current.x;
        const dy = e.evt.clientY - lastPanPos.current.y;
        lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
        setPan(panX + dx, panY + dy);
        return;
      }

      const stage = stageRef.current;
      if (!stage) return;

      const rawWorld = getWorldPointFromStage(stage);
      if (!rawWorld) return;

      // Evaluate snapping engine
      const snap = getSnapPoint(rawWorld, entities, {
        threshold: 1.0 / zoom,
        gridSnapEnabled: grid.snapToGrid,
        cellSize: grid.cellSize,
      });
      setSnapResult(snap);

      if (drawingState.isDrawing && drawingState.startPoint) {
        let currentP = snap.point;

        // Angle snapping for wall preview
        if (activeTool === 'wall') {
          const rawAngle = calculateAngle(drawingState.startPoint, currentP);
          const snappedAng = snapAngle(rawAngle, 45, 6);
          if (snappedAng !== rawAngle) {
            const dist = distanceBetweenPoints(drawingState.startPoint, currentP);
            const rad = (snappedAng * Math.PI) / 180;
            currentP = {
              x: drawingState.startPoint.x + Math.cos(rad) * dist,
              y: drawingState.startPoint.y + Math.sin(rad) * dist,
            };
          }
        }

        setDrawingState({ currentPoint: currentP });
      }
    },
    [
      isPanning,
      panX,
      panY,
      entities,
      zoom,
      grid,
      drawingState,
      activeTool,
      getWorldPointFromStage,
      setPan,
      setSnapResult,
      setDrawingState,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    lastPanPos.current = null;
  }, [setIsPanning]);

  // ── Stage Click (Deselect) ──────────────────────────────────────────────────
  const handleStageClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage() && activeTool === 'select') {
        clearSelection();
      }
    },
    [activeTool, clearSelection]
  );

  const handlePlotSelect = useCallback(() => {
    if (activeTool === 'select') {
      setSelectedEntity('plot', 'plot');
    }
  }, [activeTool, setSelectedEntity]);

  // ── Cursor style ────────────────────────────────────────────────────────────
  const getCursorStyle = () => {
    if (isPanning) return 'cursor-grabbing';
    if (activeTool === 'pan') return 'cursor-grab';
    if (activeTool === 'wall' || activeTool === 'room' || activeTool === 'dimension') {
      return 'cursor-crosshair';
    }
    return 'cursor-default';
  };

  const isPlotSelected = selectedEntityId === 'plot';
  const unitLabel = project.plot.unit === 'feet' ? 'ft' : 'm';

  // ── Drawing Preview Computations ──────────────────────────────────────────
  const previewStart = drawingState.startPoint;
  const previewCurrent = drawingState.currentPoint;

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 overflow-hidden bg-canvas-bg ${getCursorStyle()}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={canvasWidth}
        height={canvasHeight}
        scaleX={zoom}
        scaleY={zoom}
        x={panX}
        y={panY}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleStageClick}
      >
        {/* Layer 1: Adaptive Grid */}
        <Layer>
          <GridLayer width={canvasWidth} height={canvasHeight} />
        </Layer>

        {/* Layer 2: Plot Rectangle */}
        <Layer>
          <PlotLayer
            plot={project.plot}
            isSelected={isPlotSelected}
            onSelect={handlePlotSelect}
            onDeselect={clearSelection}
          />
        </Layer>

        {/* Layer 3: Rooms */}
        <Layer>
          <RoomsLayer
            rooms={rooms}
            selectedEntityIds={selectedEntityIds}
            unit={project.plot.unit}
          />
        </Layer>

        {/* Layer 4: Structural Walls */}
        <Layer>
          <WallsLayer
            walls={walls}
            selectedEntityIds={selectedEntityIds}
            unit={project.plot.unit}
          />
        </Layer>

        {/* Layer 5: Dimension Annotations */}
        <Layer>
          <DimensionsLayer
            dimensions={dimensions}
            selectedEntityIds={selectedEntityIds}
            unit={project.plot.unit}
          />
        </Layer>

        {/* Layer 6: CAD Drawing Preview */}
        <Layer>
          {drawingState.isDrawing && previewStart && previewCurrent && (
            <Group>
              {activeTool === 'wall' && (
                <>
                  <Line
                    points={[
                      previewStart.x * BASE_PIXELS_PER_UNIT,
                      previewStart.y * BASE_PIXELS_PER_UNIT,
                      previewCurrent.x * BASE_PIXELS_PER_UNIT,
                      previewCurrent.y * BASE_PIXELS_PER_UNIT,
                    ]}
                    stroke="#4d64ff"
                    strokeWidth={4 / zoom}
                    dash={[4 / zoom, 2 / zoom]}
                    opacity={0.7}
                  />
                  <Text
                    x={(previewStart.x + previewCurrent.x) / 2 * BASE_PIXELS_PER_UNIT}
                    y={(previewStart.y + previewCurrent.y) / 2 * BASE_PIXELS_PER_UNIT - 15 / zoom}
                    text={`${distanceBetweenPoints(previewStart, previewCurrent).toFixed(1)} ${unitLabel}`}
                    fontSize={11 / zoom}
                    fill="#8b9dff"
                    fontFamily="'JetBrains Mono', monospace"
                    listening={false}
                  />
                </>
              )}

              {activeTool === 'room' && (
                <>
                  <Rect
                    x={Math.min(previewStart.x, previewCurrent.x) * BASE_PIXELS_PER_UNIT}
                    y={Math.min(previewStart.y, previewCurrent.y) * BASE_PIXELS_PER_UNIT}
                    width={Math.abs(previewCurrent.x - previewStart.x) * BASE_PIXELS_PER_UNIT}
                    height={Math.abs(previewCurrent.y - previewStart.y) * BASE_PIXELS_PER_UNIT}
                    fill="rgba(77, 100, 255, 0.15)"
                    stroke="#4d64ff"
                    strokeWidth={1.5 / zoom}
                    dash={[4 / zoom, 2 / zoom]}
                  />
                  <Text
                    x={Math.min(previewStart.x, previewCurrent.x) * BASE_PIXELS_PER_UNIT + 8 / zoom}
                    y={Math.min(previewStart.y, previewCurrent.y) * BASE_PIXELS_PER_UNIT + 8 / zoom}
                    text={`${Math.abs(previewCurrent.x - previewStart.x).toFixed(1)} × ${Math.abs(previewCurrent.y - previewStart.y).toFixed(1)} ${unitLabel}`}
                    fontSize={11 / zoom}
                    fill="#93c5fd"
                    fontFamily="'JetBrains Mono', monospace"
                    listening={false}
                  />
                </>
              )}

              {activeTool === 'dimension' && (
                <Line
                  points={[
                    previewStart.x * BASE_PIXELS_PER_UNIT,
                    previewStart.y * BASE_PIXELS_PER_UNIT,
                    previewCurrent.x * BASE_PIXELS_PER_UNIT,
                    previewCurrent.y * BASE_PIXELS_PER_UNIT,
                  ]}
                  stroke="#a855f7"
                  strokeWidth={1.5 / zoom}
                  dash={[3 / zoom, 2 / zoom]}
                />
              )}
            </Group>
          )}
        </Layer>

        {/* Layer 7: Snap Indicators (top priority overlay) */}
        <Layer>
          <SnapIndicatorLayer />
        </Layer>
      </Stage>

      {/* Compass Widget Overlay */}
      {project.settings.showCompass && (
        <CompassWidget facing={project.plot.facing} size={84} />
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1">
        <Tooltip content="Zoom In" side="right">
          <button
            id="canvas-zoom-in-btn"
            className="w-7 h-7 bg-panel-bg border border-panel-border rounded flex items-center justify-center
                       hover:bg-surface transition-colors text-text-secondary hover:text-text-primary"
            onClick={zoomIn}
          >
            <ZoomIn size={13} />
          </button>
        </Tooltip>
        <Tooltip content="Zoom Out" side="right">
          <button
            id="canvas-zoom-out-btn"
            className="w-7 h-7 bg-panel-bg border border-panel-border rounded flex items-center justify-center
                       hover:bg-surface transition-colors text-text-secondary hover:text-text-primary"
            onClick={zoomOut}
          >
            <ZoomOut size={13} />
          </button>
        </Tooltip>
        <Tooltip content="Fit to Plot" side="right">
          <button
            id="canvas-fit-btn"
            className="w-7 h-7 bg-panel-bg border border-panel-border rounded flex items-center justify-center
                       hover:bg-surface transition-colors text-text-secondary hover:text-text-primary"
            onClick={() => fitToPlot(project.plot.width, project.plot.length)}
          >
            <Maximize2 size={13} />
          </button>
        </Tooltip>
        <div className="text-center text-2xs font-mono-numbers text-text-muted mt-0.5">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Canvas Tool Hint */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-panel-bg/80 border border-panel-border rounded px-3 py-1.5 text-2xs text-text-muted backdrop-blur-sm shadow-panel">
          {activeTool === 'select' && 'Click objects to select · Shift+Click for multi-selection · Del to delete'}
          {activeTool === 'wall' && 'Click & drag or click two points to draw a Wall · Esc to cancel'}
          {activeTool === 'room' && 'Click & drag to create a Room · Esc to cancel'}
          {activeTool === 'dimension' && 'Click two points to place a Dimension annotation · Esc to cancel'}
          {activeTool === 'pan' && 'Click & drag to pan canvas'}
        </div>
      </div>
    </div>
  );
};
