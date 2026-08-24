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
  DoorEntity,
  WindowEntity,
  StaircaseEntity,
  ColumnEntity,
  ParkingEntity,
  GardenEntity,
  CompoundWallEntity,
  GateEntity,
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
import { DoorsLayer } from './DoorsLayer';
import { WindowsLayer } from './WindowsLayer';
import { StaircasesLayer } from './StaircasesLayer';
import { ColumnsLayer } from './ColumnsLayer';
import { ParkingLayer } from './ParkingLayer';
import { GardenLayer } from './GardenLayer';
import { CompoundWallsLayer } from './CompoundWallsLayer';
import { GatesLayer } from './GatesLayer';
import { SnapIndicatorLayer } from './SnapIndicatorLayer';
import { CompassWidget } from './CompassWidget';
import { VastuHeatmapLayer } from './VastuHeatmapLayer';
import { useVastuStore } from '../../features/vastu/vastuStore';
import { AIPreviewLayer } from '../../features/ai';
import { BASE_PIXELS_PER_UNIT } from '../../constants';
import { getSnapPoint } from '../../utils/snapping';
import { distanceBetweenPoints, calculateAngle, snapAngle, projectPointOntoLine } from '../../utils/geometry';
import { calculateHostedPosition, validateWallOccupancy } from '../../utils/architectural';
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
  const { isVastuActive, vastuAnalysis, vastuSettings } = useVastuStore();

  const floor = project.floors[0] || { entities: [] };
  const entities = floor.entities || [];

  const walls = entities.filter((e) => e.type === 'wall') as unknown as WallEntity[];
  const rooms = entities.filter((e) => e.type === 'room') as unknown as RoomEntity[];
  const dimensions = entities.filter((e) => e.type === 'dimension') as unknown as DimensionEntity[];
  const doors = entities.filter((e) => e.type === 'door') as unknown as DoorEntity[];
  const windows = entities.filter((e) => e.type === 'window') as unknown as WindowEntity[];
  const staircases = entities.filter((e) => e.type === 'staircase') as unknown as StaircaseEntity[];
  const columns = entities.filter((e) => e.type === 'column') as unknown as ColumnEntity[];
  const parkingSpaces = entities.filter((e) => e.type === 'parking') as unknown as ParkingEntity[];
  const gardens = entities.filter((e) => e.type === 'garden') as unknown as GardenEntity[];
  const compoundWalls = entities.filter((e) => e.type === 'compound-wall') as unknown as CompoundWallEntity[];
  const gates = entities.filter((e) => e.type === 'gate') as unknown as GateEntity[];

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

  // ── Mouse Handlers ──────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      // Middle click or Alt+click triggers pan
      if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.altKey) || activeTool === 'pan') {
        setIsPanning(true);
        return;
      }

      if (e.evt.button !== 0) return; // Only left click

      const stage = stageRef.current;
      if (!stage) return;

      const rawWorld = getWorldPointFromStage(stage);
      if (!rawWorld) return;

      const snap = getSnapPoint(rawWorld, entities, {
        threshold: 1.0 / zoom,
        gridSnapEnabled: grid.snapToGrid,
        cellSize: grid.cellSize,
      });

      const p = snap.point;

      // Single-click placement tools (Door, Window, Gate, Column, Staircase, Parking)
      if (activeTool === 'door' || activeTool === 'window') {
        let closestWall: WallEntity | null = null;
        let minWallDist = 2.0 / zoom;
        let projOffset = 0;

        for (const wall of walls) {
          const p1 = { x: wall.properties.startX, y: wall.properties.startY };
          const p2 = { x: wall.properties.endX, y: wall.properties.endY };
          const proj = projectPointOntoLine(rawWorld, p1, p2);
          if (proj.distance < minWallDist) {
            minWallDist = proj.distance;
            closestWall = wall;
            projOffset = proj.t * distanceBetweenPoints(p1, p2);
          }
        }

        if (!closestWall) {
          alert('Click near a wall to place a door or window.');
          return;
        }

        const compWidth = activeTool === 'door' ? 3 : 4;
        const otherHosted = entities.filter(
          (e) =>
            (e.type === 'door' || e.type === 'window') &&
            (e.properties as { hostWallId?: string }).hostWallId === closestWall!.id
        ) as unknown as { id: string; properties: { offsetAlongWall: number; width: number } }[];

        const val = validateWallOccupancy(
          closestWall.properties,
          otherHosted,
          projOffset,
          compWidth
        );

        if (!val.valid) {
          alert(val.reason);
          return;
        }

        const { position, rotation } = calculateHostedPosition(closestWall.properties, projOffset);
        const entitiesBefore = [...entities];

        if (activeTool === 'door') {
          const newDoor: DoorEntity = {
            id: `door_${Date.now()}`,
            type: 'door',
            position,
            rotation,
            dimensions: { width: compWidth, height: 0.5 },
            floorIndex: 0,
            locked: false,
            visible: true,
            properties: {
              hostWallId: closestWall.id,
              offsetAlongWall: projOffset,
              doorType: 'single',
              swingDirection: 'left',
              swingOrientation: 'inward',
              width: compWidth,
              height: 7,
            },
          };
          addEntity(newDoor as unknown as DesignEntity);
          setSelectedEntity(newDoor.id, 'door');
        } else {
          const newWin: WindowEntity = {
            id: `window_${Date.now()}`,
            type: 'window',
            position,
            rotation,
            dimensions: { width: compWidth, height: 0.5 },
            floorIndex: 0,
            locked: false,
            visible: true,
            properties: {
              hostWallId: closestWall.id,
              offsetAlongWall: projOffset,
              windowType: 'sliding',
              width: compWidth,
              height: 4,
            },
          };
          addEntity(newWin as unknown as DesignEntity);
          setSelectedEntity(newWin.id, 'window');
        }

        const entitiesAfter = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
        pushHistory(
          createHistoryAction(
            'CREATE_ENTITY',
            entitiesBefore,
            entitiesAfter,
            `Create ${activeTool === 'door' ? 'Door' : 'Window'}`
          )
        );
        setActiveTool('select');
        return;
      }

      if (activeTool === 'gate') {
        let closestCW: CompoundWallEntity | null = null;
        let closestSegId = '';
        let closestSeg: any = null;
        let minDist = 3.0 / zoom;
        let projOffset = 0;

        for (const cw of compoundWalls) {
          const segs = cw.properties.segments || [];
          for (const seg of segs) {
            const p1 = { x: seg.startX, y: seg.startY };
            const p2 = { x: seg.endX, y: seg.endY };
            const proj = projectPointOntoLine(rawWorld, p1, p2);
            if (proj.distance < minDist) {
              minDist = proj.distance;
              closestCW = cw;
              closestSegId = seg.id;
              closestSeg = seg;
              projOffset = proj.t * distanceBetweenPoints(p1, p2);
            }
          }
        }

        if (!closestCW || !closestSeg) {
          alert('Click near a compound wall boundary segment to place a gate.');
          return;
        }

        const gateW = 8;
        const { position, rotation } = calculateHostedPosition(closestSeg, projOffset);
        const entitiesBefore = [...entities];

        const newGate: GateEntity = {
          id: `gate_${Date.now()}`,
          type: 'gate',
          position,
          rotation,
          dimensions: { width: gateW, height: 0.5 },
          floorIndex: 0,
          locked: false,
          visible: true,
          properties: {
            hostCompoundWallId: closestCW.id,
            hostSegmentId: closestSegId,
            offsetAlongWall: projOffset,
            gateType: 'double',
            width: gateW,
          },
        };

        addEntity(newGate as unknown as DesignEntity);
        const entitiesAfter = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
        pushHistory(createHistoryAction('CREATE_ENTITY', entitiesBefore, entitiesAfter, 'Create Gate'));
        setSelectedEntity(newGate.id, 'gate');
        setActiveTool('select');
        return;
      }

      if (activeTool === 'column') {
        const entitiesBefore = [...entities];
        const newCol: ColumnEntity = {
          id: `col_${Date.now()}`,
          type: 'column',
          position: p,
          rotation: 0,
          dimensions: { width: 0.75, height: 0.75 },
          floorIndex: 0,
          locked: false,
          visible: true,
          properties: {
            width: 0.75,
            depth: 0.75,
            shape: 'rectangle',
          },
        };
        addEntity(newCol as unknown as DesignEntity);
        const entitiesAfter = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
        pushHistory(createHistoryAction('CREATE_ENTITY', entitiesBefore, entitiesAfter, 'Create Column'));
        setSelectedEntity(newCol.id, 'column');
        setActiveTool('select');
        return;
      }

      if (activeTool === 'staircase') {
        const entitiesBefore = [...entities];
        const newStair: StaircaseEntity = {
          id: `stair_${Date.now()}`,
          type: 'staircase',
          position: p,
          rotation: 0,
          dimensions: { width: 4, height: 12 },
          floorIndex: 0,
          locked: false,
          visible: true,
          properties: {
            staircaseType: 'straight',
            steps: 18,
            direction: 'up',
            width: 4,
          },
        };
        addEntity(newStair as unknown as DesignEntity);
        const entitiesAfter = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
        pushHistory(createHistoryAction('CREATE_ENTITY', entitiesBefore, entitiesAfter, 'Create Staircase'));
        setSelectedEntity(newStair.id, 'staircase');
        setActiveTool('select');
        return;
      }

      if (activeTool === 'parking') {
        const entitiesBefore = [...entities];
        const newParking: ParkingEntity = {
          id: `parking_${Date.now()}`,
          type: 'parking',
          position: p,
          rotation: 0,
          dimensions: { width: 18, height: 18 },
          floorIndex: 0,
          locked: false,
          visible: true,
          properties: {
            parkingType: 'car',
            vehicleCount: 2,
          },
        };
        addEntity(newParking as unknown as DesignEntity);
        const entitiesAfter = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
        pushHistory(createHistoryAction('CREATE_ENTITY', entitiesBefore, entitiesAfter, 'Create Parking Space'));
        setSelectedEntity(newParking.id, 'parking');
        setActiveTool('select');
        return;
      }

      if (activeTool === 'garden') {
        const entitiesBefore = [...entities];
        const newGarden: GardenEntity = {
          id: `garden_${Date.now()}`,
          type: 'garden',
          position: p,
          rotation: 0,
          dimensions: { width: 12, height: 15 },
          floorIndex: 0,
          locked: false,
          visible: true,
          properties: {
            gardenType: 'garden',
          },
        };
        addEntity(newGarden as unknown as DesignEntity);
        const entitiesAfter = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
        pushHistory(createHistoryAction('CREATE_ENTITY', entitiesBefore, entitiesAfter, 'Create Garden Space'));
        setSelectedEntity(newGarden.id, 'garden');
        setActiveTool('select');
        return;
      }

      if (activeTool === 'compound-wall') {
        const entitiesBefore = [...entities];
        const newCW: CompoundWallEntity = {
          id: `cw_${Date.now()}`,
          type: 'compound-wall',
          position: p,
          rotation: 0,
          dimensions: { width: project.plot.width, height: project.plot.length },
          floorIndex: 0,
          locked: false,
          visible: true,
          properties: {
            thickness: 0.75,
            segments: [
              { id: `seg_${Date.now()}_1`, startX: 0, startY: 0, endX: project.plot.width, endY: 0 },
              { id: `seg_${Date.now()}_2`, startX: project.plot.width, startY: 0, endX: project.plot.width, endY: project.plot.length },
              { id: `seg_${Date.now()}_3`, startX: project.plot.width, startY: project.plot.length, endX: 0, endY: project.plot.length },
              { id: `seg_${Date.now()}_4`, startX: 0, startY: project.plot.length, endX: 0, endY: 0 },
            ],
          },
        };
        addEntity(newCW as unknown as DesignEntity);
        const entitiesAfter = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
        pushHistory(createHistoryAction('CREATE_ENTITY', entitiesBefore, entitiesAfter, 'Create Compound Wall Boundary'));
        setSelectedEntity(newCW.id, 'compound-wall');
        setActiveTool('select');
        return;
      }

      // Drag-to-draw tools (Wall, Room, Dimension)
      if (activeTool === 'wall' || activeTool === 'room' || activeTool === 'dimension') {
        if (!drawingState.isDrawing) {
          setDrawingState({
            isDrawing: true,
            startPoint: p,
            currentPoint: p,
          });
        } else {
          // Finalize drawing on second click
          const startP = drawingState.startPoint!;
          let endP = p;

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

            const wallLength = distanceBetweenPoints(startP, endP);
            if (wallLength >= 0.5) {
              const entitiesBefore = [...entities];
              const newWall: WallEntity = {
                id: `wall_${Date.now()}`,
                type: 'wall',
                position: { x: Math.min(startP.x, endP.x), y: Math.min(startP.y, endP.y) },
                rotation: 0,
                dimensions: { width: wallLength, height: 0.375 },
                floorIndex: 0,
                locked: false,
                visible: true,
                properties: {
                  startX: startP.x,
                  startY: startP.y,
                  endX: endP.x,
                  endY: endP.y,
                  thickness: 0.375,
                },
              };

              addEntity(newWall as unknown as DesignEntity);
              const entitiesAfter = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
              pushHistory(createHistoryAction('CREATE_ENTITY', entitiesBefore, entitiesAfter, 'Create Wall'));
              setSelectedEntity(newWall.id, 'wall');
            }
          } else if (activeTool === 'room') {
            const rx = Math.min(startP.x, endP.x);
            const ry = Math.min(startP.y, endP.y);
            const rw = Math.abs(endP.x - startP.x);
            const rh = Math.abs(endP.y - startP.y);

            if (rw >= 1 && rh >= 1) {
              const entitiesBefore = [...entities];
              const name = `Room ${roomCountRef.current++}`;
              const newRoom: RoomEntity = {
                id: `room_${Date.now()}`,
                type: 'room',
                position: { x: rx, y: ry },
                rotation: 0,
                dimensions: { width: rw, height: rh },
                floorIndex: 0,
                locked: false,
                visible: true,
                properties: {
                  name,
                  roomType: 'generic',
                  displayName: name,
                },
              };

              addEntity(newRoom as unknown as DesignEntity);
              const entitiesAfter = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
              pushHistory(createHistoryAction('CREATE_ENTITY', entitiesBefore, entitiesAfter, `Create ${name}`));
              setSelectedEntity(newRoom.id, 'room');
            }
          } else if (activeTool === 'dimension') {
            const dist = distanceBetweenPoints(startP, endP);
            if (dist >= 0.5) {
              const entitiesBefore = [...entities];
              const newDim: DimensionEntity = {
                id: `dim_${Date.now()}`,
                type: 'dimension',
                position: { x: (startP.x + endP.x) / 2, y: (startP.y + endP.y) / 2 },
                rotation: calculateAngle(startP, endP),
                dimensions: { width: dist, height: 1 },
                floorIndex: 0,
                locked: false,
                visible: true,
                properties: {
                  startX: startP.x,
                  startY: startP.y,
                  endX: endP.x,
                  endY: endP.y,
                  offset: 1.5,
                },
              };

              addEntity(newDim as unknown as DesignEntity);
              const entitiesAfter = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];
              pushHistory(createHistoryAction('CREATE_ENTITY', entitiesBefore, entitiesAfter, 'Create Dimension'));
              setSelectedEntity(newDim.id, 'dimension');
            }
          }

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
      walls,
      compoundWalls,
      zoom,
      grid,
      project.plot,
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
      const stage = stageRef.current;
      if (!stage) return;

      const rawWorld = getWorldPointFromStage(stage);
      if (!rawWorld) return;

      const snap = getSnapPoint(rawWorld, entities, {
        threshold: 1.0 / zoom,
        gridSnapEnabled: grid.snapToGrid,
        cellSize: grid.cellSize,
      });
      setSnapResult(snap);

      if (drawingState.isDrawing && drawingState.startPoint) {
        let currentP = snap.point;
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
    [entities, zoom, grid, drawingState, activeTool, getWorldPointFromStage, setSnapResult, setDrawingState]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, [setIsPanning]);

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

  const getCursorStyle = () => {
    if (isPanning) return 'cursor-grabbing';
    if (activeTool === 'pan') return 'cursor-grab';
    if (
      activeTool === 'wall' ||
      activeTool === 'room' ||
      activeTool === 'dimension' ||
      activeTool === 'door' ||
      activeTool === 'window' ||
      activeTool === 'gate'
    ) {
      return 'cursor-crosshair';
    }
    return 'cursor-default';
  };

  const isPlotSelected = selectedEntityId === 'plot';
  const unitLabel = project.plot.unit === 'feet' ? 'ft' : 'm';
  const previewStart = drawingState.startPoint;
  const previewCurrent = drawingState.currentPoint;

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 overflow-hidden bg-canvas-bg ${getCursorStyle()}`}
      onContextMenu={(e) => e.preventDefault()}
    >
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

        {/* Layer 2: Plot Boundaries */}
        <Layer>
          <PlotLayer
            plot={project.plot}
            isSelected={isPlotSelected}
            onSelect={handlePlotSelect}
            onDeselect={clearSelection}
          />
        </Layer>

        {/* Layer 2.5: Vastu Heatmap (when Vastu Analysis is active) */}
        {isVastuActive && (
          <Layer listening={false}>
            <VastuHeatmapLayer
              vastuAnalysis={vastuAnalysis}
              zoom={zoom}
              settings={vastuSettings}
            />
          </Layer>
        )}

        {/* Layer 3: Garden / Lawn */}
        <Layer>
          <GardenLayer gardens={gardens} zoom={zoom} />
        </Layer>

        {/* Layer 4: Parking Bays */}
        <Layer>
          <ParkingLayer parkingSpaces={parkingSpaces} zoom={zoom} />
        </Layer>

        {/* Layer 5: Rooms */}
        <Layer>
          <RoomsLayer rooms={rooms} selectedEntityIds={selectedEntityIds} unit={project.plot.unit} />
        </Layer>

        {/* Layer 6: Compound Walls */}
        <Layer>
          <CompoundWallsLayer compoundWalls={compoundWalls} zoom={zoom} />
        </Layer>

        {/* Layer 7: Structural Walls */}
        <Layer>
          <WallsLayer walls={walls} selectedEntityIds={selectedEntityIds} unit={project.plot.unit} />
        </Layer>

        {/* Layer 8: Columns */}
        <Layer>
          <ColumnsLayer columns={columns} zoom={zoom} />
        </Layer>

        {/* Layer 9: Staircases */}
        <Layer>
          <StaircasesLayer staircases={staircases} zoom={zoom} />
        </Layer>

        {/* Layer 10: Doors */}
        <Layer>
          <DoorsLayer doors={doors} zoom={zoom} />
        </Layer>

        {/* Layer 11: Windows */}
        <Layer>
          <WindowsLayer windows={windows} zoom={zoom} />
        </Layer>

        {/* Layer 12: Gates */}
        <Layer>
          <GatesLayer gates={gates} zoom={zoom} />
        </Layer>

        {/* Layer 13: Dimensions */}
        <Layer>
          <DimensionsLayer dimensions={dimensions} selectedEntityIds={selectedEntityIds} unit={project.plot.unit} />
        </Layer>

        {/* Layer 14: Active CAD Drawing Preview */}
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
                    x={((previewStart.x + previewCurrent.x) / 2) * BASE_PIXELS_PER_UNIT}
                    y={((previewStart.y + previewCurrent.y) / 2) * BASE_PIXELS_PER_UNIT - 15 / zoom}
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
            </Group>
          )}
        </Layer>

        {/* Layer 14.5: AI Proposal Preview Ghost Overlay */}
        <Layer listening={false}>
          <AIPreviewLayer zoom={zoom} />
        </Layer>

        {/* Layer 15: Snap Indicators */}
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
            aria-label="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
        </Tooltip>
        <Tooltip content="Zoom Out" side="right">
          <button
            id="canvas-zoom-out-btn"
            className="w-7 h-7 bg-panel-bg border border-panel-border rounded flex items-center justify-center
                       hover:bg-surface transition-colors text-text-secondary hover:text-text-primary"
            onClick={zoomOut}
            aria-label="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
        </Tooltip>
        <Tooltip content="Fit to Screen" side="right">
          <button
            id="canvas-zoom-fit-btn"
            className="w-7 h-7 bg-panel-bg border border-panel-border rounded flex items-center justify-center
                       hover:bg-surface transition-colors text-text-secondary hover:text-text-primary"
            onClick={() => fitToPlot(project.plot.width, project.plot.length)}
            aria-label="Fit to Screen"
          >
            <Maximize2 size={14} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
