import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GridSettings } from '@vastuplan/shared';
import type { DesignEntityType } from '@vastuplan/shared';
import {
  ZOOM_DEFAULT,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_STEP,
  GRID_DEFAULT_CELL_SIZE,
} from '../constants';
import { clampZoom, calcPanForZoomToPoint, screenToWorld } from '../utils/geometry';
import { BASE_PIXELS_PER_UNIT } from '../constants';

interface CanvasStore {
  // View
  zoom: number;
  panX: number;
  panY: number;

  // Grid
  grid: GridSettings;

  // Selection
  selectedEntityId: string | null;
  selectedEntityType: DesignEntityType | null;

  // Interaction
  isPanning: boolean;
  canvasWidth: number;
  canvasHeight: number;

  // Actions
  setZoom: (zoom: number) => void;
  setPan: (panX: number, panY: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  zoomToPoint: (screenX: number, screenY: number, delta: number) => void;
  setIsPanning: (isPanning: boolean) => void;
  setCanvasSize: (width: number, height: number) => void;
  setSelectedEntity: (id: string | null, type?: DesignEntityType | null) => void;
  clearSelection: () => void;
  updateGrid: (updates: Partial<GridSettings>) => void;
  fitToPlot: (plotWidth: number, plotHeight: number) => void;
}

export const useCanvasStore = create<CanvasStore>()(
  immer((set, get) => ({
    // ── Initial state ──
    zoom: ZOOM_DEFAULT,
    panX: 0,
    panY: 0,
    grid: {
      visible: true,
      cellSize: GRID_DEFAULT_CELL_SIZE,
      snapToGrid: false,
    },
    selectedEntityId: null,
    selectedEntityType: null,
    isPanning: false,
    canvasWidth: 800,
    canvasHeight: 600,

    // ── Zoom ──
    setZoom: (zoom: number) => {
      set((s) => { s.zoom = clampZoom(zoom, ZOOM_MIN, ZOOM_MAX); });
    },

    // ── Pan ──
    setPan: (panX: number, panY: number) => {
      set((s) => { s.panX = panX; s.panY = panY; });
    },

    // ── Zoom in ──
    zoomIn: () => {
      set((s) => {
        const { zoom, canvasWidth, canvasHeight, panX, panY } = s;
        const newZoom = clampZoom(zoom * (1 + ZOOM_STEP), ZOOM_MIN, ZOOM_MAX);
        // Zoom toward canvas center
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const worldCenter = screenToWorld(centerX, centerY, zoom, panX, panY, BASE_PIXELS_PER_UNIT);
        const newPan = calcPanForZoomToPoint(
          worldCenter,
          { x: centerX, y: centerY },
          newZoom,
          BASE_PIXELS_PER_UNIT
        );
        s.zoom = newZoom;
        s.panX = newPan.panX;
        s.panY = newPan.panY;
      });
    },

    // ── Zoom out ──
    zoomOut: () => {
      set((s) => {
        const { zoom, canvasWidth, canvasHeight, panX, panY } = s;
        const newZoom = clampZoom(zoom * (1 - ZOOM_STEP), ZOOM_MIN, ZOOM_MAX);
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const worldCenter = screenToWorld(centerX, centerY, zoom, panX, panY, BASE_PIXELS_PER_UNIT);
        const newPan = calcPanForZoomToPoint(
          worldCenter,
          { x: centerX, y: centerY },
          newZoom,
          BASE_PIXELS_PER_UNIT
        );
        s.zoom = newZoom;
        s.panX = newPan.panX;
        s.panY = newPan.panY;
      });
    },

    // ── Reset zoom to 100% centered ──
    resetZoom: () => {
      const { canvasWidth, canvasHeight } = get();
      set((s) => {
        s.zoom = ZOOM_DEFAULT;
        s.panX = canvasWidth / 4;
        s.panY = canvasHeight / 4;
      });
    },

    // ── Zoom to cursor point (mouse wheel) ──
    zoomToPoint: (screenX: number, screenY: number, delta: number) => {
      set((s) => {
        const { zoom, panX, panY } = s;
        // delta < 0 = zoom in, delta > 0 = zoom out
        const factor = 1 - delta * 0.001;
        const newZoom = clampZoom(zoom * factor, ZOOM_MIN, ZOOM_MAX);
        const worldPoint = screenToWorld(screenX, screenY, zoom, panX, panY, BASE_PIXELS_PER_UNIT);
        const newPan = calcPanForZoomToPoint(
          worldPoint,
          { x: screenX, y: screenY },
          newZoom,
          BASE_PIXELS_PER_UNIT
        );
        s.zoom = newZoom;
        s.panX = newPan.panX;
        s.panY = newPan.panY;
      });
    },

    // ── Pan drag state ──
    setIsPanning: (isPanning: boolean) => {
      set((s) => { s.isPanning = isPanning; });
    },

    // ── Canvas dimensions ──
    setCanvasSize: (width: number, height: number) => {
      set((s) => { s.canvasWidth = width; s.canvasHeight = height; });
    },

    // ── Selection ──
    setSelectedEntity: (id: string | null, type?: DesignEntityType | null) => {
      set((s) => {
        s.selectedEntityId = id;
        s.selectedEntityType = type ?? null;
      });
    },

    clearSelection: () => {
      set((s) => { s.selectedEntityId = null; s.selectedEntityType = null; });
    },

    // ── Grid settings ──
    updateGrid: (updates: Partial<GridSettings>) => {
      set((s) => { s.grid = { ...s.grid, ...updates }; });
    },

    // ── Fit canvas view to a plot ──
    fitToPlot: (plotWidth: number, plotHeight: number) => {
      const { canvasWidth, canvasHeight } = get();
      const padding = 80; // pixels of padding around plot
      const scaleX = (canvasWidth - padding * 2) / (plotWidth * BASE_PIXELS_PER_UNIT);
      const scaleY = (canvasHeight - padding * 2) / (plotHeight * BASE_PIXELS_PER_UNIT);
      const newZoom = clampZoom(Math.min(scaleX, scaleY), ZOOM_MIN, ZOOM_MAX);

      const plotScreenW = plotWidth * BASE_PIXELS_PER_UNIT * newZoom;
      const plotScreenH = plotHeight * BASE_PIXELS_PER_UNIT * newZoom;

      set((s) => {
        s.zoom = newZoom;
        s.panX = (canvasWidth - plotScreenW) / 2;
        s.panY = (canvasHeight - plotScreenH) / 2;
      });
    },
  }))
);
