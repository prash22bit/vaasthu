import { useEffect, useCallback } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { useHistoryStore, createHistoryAction } from '../stores/historyStore';
import { useCanvasStore } from '../stores/canvasStore';
import { FACING_DEGREES } from '@vastuplan/shared';
import type { FacingDirection, Plot, Unit } from '@vastuplan/shared';
import { convertUnit } from '../utils/units';

/**
 * Hook that provides project operations with integrated history tracking.
 */
export function useProject() {
  const {
    currentProject,
    saveStatus,
    error,
    loadingProject,
    loadingProjects,
    projects,
    loadProjects,
    loadProject,
    createProject,
    updateProject,
    deleteProject,
    updateCurrentPlot,
    saveCurrentProject,
    clearError,
  } = useProjectStore();

  const { push: pushHistory } = useHistoryStore();
  const fitToPlot = useCanvasStore((s) => s.fitToPlot);

  // ── Auto-fit canvas when project changes ──
  useEffect(() => {
    if (currentProject) {
      fitToPlot(currentProject.plot.width, currentProject.plot.length);
    }
  }, [currentProject?.id, fitToPlot]);

  // ── Update plot facing with history ──
  const updateFacing = useCallback(
    (facing: FacingDirection) => {
      if (!currentProject) return;
      const before = { ...currentProject.plot };
      const orientationDegrees = FACING_DEGREES[facing];
      updateCurrentPlot({ facing, orientationDegrees });
      const after = { ...currentProject.plot, facing, orientationDegrees };
      pushHistory(createHistoryAction('UPDATE_PLOT', before, after, `Change facing to ${facing}`));
    },
    [currentProject, updateCurrentPlot, pushHistory]
  );

  // ── Update plot dimensions with history ──
  const updateDimensions = useCallback(
    (width: number, length: number) => {
      if (!currentProject) return;
      const before = { ...currentProject.plot };
      updateCurrentPlot({ width, length });
      const after = { ...currentProject.plot, width, length };
      pushHistory(createHistoryAction('UPDATE_PLOT', before, after, `Resize plot to ${width}×${length}`));
    },
    [currentProject, updateCurrentPlot, pushHistory]
  );

  // ── Update unit with automatic conversion ──
  const updateUnit = useCallback(
    (newUnit: Unit) => {
      if (!currentProject) return;
      const before = { ...currentProject.plot };
      const { unit: currentUnit, width, length } = currentProject.plot;

      if (currentUnit === newUnit) return;

      const newWidth = convertUnit(width, currentUnit, newUnit);
      const newLength = convertUnit(length, currentUnit, newUnit);

      // Round to reasonable precision to avoid floating-point accumulation
      const roundedWidth = parseFloat(newWidth.toFixed(4));
      const roundedLength = parseFloat(newLength.toFixed(4));

      updateCurrentPlot({ unit: newUnit, width: roundedWidth, length: roundedLength });
      const after = { ...currentProject.plot, unit: newUnit, width: roundedWidth, length: roundedLength };
      pushHistory(
        createHistoryAction('UPDATE_PLOT', before, after, `Change unit to ${newUnit}`)
      );
    },
    [currentProject, updateCurrentPlot, pushHistory]
  );

  // ── Update plot shape ──
  const updateShape = useCallback(
    (shape: Plot['shape']) => {
      if (!currentProject) return;
      updateCurrentPlot({ shape });
    },
    [currentProject, updateCurrentPlot]
  );

  return {
    currentProject,
    projects,
    saveStatus,
    error,
    loadingProject,
    loadingProjects,
    loadProjects,
    loadProject,
    createProject,
    updateProject,
    deleteProject,
    saveCurrentProject,
    clearError,
    updateFacing,
    updateDimensions,
    updateUnit,
    updateShape,
  };
}
