import React, { useRef, useEffect, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Project } from '@vastuplan/shared';
import { useCanvasStore } from '../../stores/canvasStore';
import { useUIStore } from '../../stores/uiStore';
import { GridLayer } from './GridLayer';
import { PlotLayer } from './PlotLayer';
import { CompassWidget } from './CompassWidget';
import { BASE_PIXELS_PER_UNIT } from '../../constants';
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
    isPanning,
    setZoom,
    setPan,
    zoomIn,
    zoomOut,
    zoomToPoint,
    setIsPanning,
    setCanvasSize,
    selectedEntityId,
    setSelectedEntity,
    clearSelection,
    fitToPlot,
  } = useCanvasStore();

  const { activeTool } = useUIStore();

  // ── Resize observer ─────────────────────────────────────────────────────────
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

  // ── Initial fit ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fitToPlot(project.plot.width, project.plot.length);
  }, [project.id]);

  // ── Mouse wheel zoom ────────────────────────────────────────────────────────
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

  // ── Pan (drag) ──────────────────────────────────────────────────────────────
  const lastPanPos = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const isMiddleButton = e.evt.button === 1;
      const isSpaceOrPanTool = activeTool === 'pan';

      if (isMiddleButton || isSpaceOrPanTool) {
        e.evt.preventDefault();
        setIsPanning(true);
        lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
      }
    },
    [activeTool, setIsPanning]
  );

  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (!isPanning || !lastPanPos.current) return;

      const dx = e.evt.clientX - lastPanPos.current.x;
      const dy = e.evt.clientY - lastPanPos.current.y;
      lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
      setPan(panX + dx, panY + dy);
    },
    [isPanning, panX, panY, setPan]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    lastPanPos.current = null;
  }, [setIsPanning]);

  // ── Stage click (deselect) ──────────────────────────────────────────────────
  const handleStageClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      // Only deselect when clicking the stage background
      if (e.target === e.target.getStage()) {
        clearSelection();
      }
    },
    [clearSelection]
  );

  // ── Plot selection ──────────────────────────────────────────────────────────
  const handlePlotSelect = useCallback(() => {
    setSelectedEntity('plot', 'plot');
  }, [setSelectedEntity]);

  // ── Cursor style ────────────────────────────────────────────────────────────
  const getCursorStyle = () => {
    if (isPanning) return 'cursor-grabbing';
    if (activeTool === 'pan') return 'cursor-grab';
    return 'cursor-default';
  };

  // ── Canvas dimensions ────────────────────────────────────────────────────────
  const { canvasWidth, canvasHeight } = useCanvasStore();

  const isPlotSelected = selectedEntityId === 'plot';

  return (
    <div ref={containerRef} className={`relative flex-1 overflow-hidden bg-canvas-bg ${getCursorStyle()}`}>
      {/* Konva Stage */}
      <Stage
        ref={stageRef}
        width={canvasWidth}
        height={canvasHeight}
        // Apply zoom and pan as stage-level transform
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
        {/* ── Grid layer (bottom, not affected by selection) ── */}
        <Layer>
          <GridLayer width={canvasWidth} height={canvasHeight} />
        </Layer>

        {/* ── Plot layer ── */}
        <Layer>
          <PlotLayer
            plot={project.plot}
            isSelected={isPlotSelected}
            onSelect={handlePlotSelect}
            onDeselect={clearSelection}
          />
        </Layer>
      </Stage>

      {/* ── Compass overlay ── */}
      {project.settings.showCompass && (
        <CompassWidget facing={project.plot.facing} size={84} />
      )}

      {/* ── Zoom controls ── */}
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

        {/* Zoom % display */}
        <div className="text-center text-2xs font-mono-numbers text-text-muted mt-0.5">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* ── Canvas hint (when nothing selected) ── */}
      {!selectedEntityId && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-panel-bg/80 border border-panel-border rounded px-2.5 py-1 text-2xs text-text-muted backdrop-blur-sm">
            Click the plot to select it · Scroll to zoom · Middle-click to pan
          </div>
        </div>
      )}
    </div>
  );
};
