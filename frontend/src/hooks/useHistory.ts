import { useHistoryStore } from '../stores/historyStore';
import { useProjectStore } from '../stores/projectStore';
import type { HistoryAction, Plot } from '@vastuplan/shared';

/**
 * Hook for undo/redo operations with integrated project state restoration.
 */
export function useHistory() {
  const { past, future, canUndo, canRedo, undo, redo, clear } = useHistoryStore();
  const { updateCurrentPlot, setSaveStatus } = useProjectStore();

  const performUndo = () => {
    const action = undo();
    if (!action) return;

    applyHistoryAction(action, 'undo', updateCurrentPlot, setSaveStatus);
  };

  const performRedo = () => {
    const action = redo();
    if (!action) return;

    applyHistoryAction(action, 'redo', updateCurrentPlot, setSaveStatus);
  };

  return {
    past,
    future,
    canUndo,
    canRedo,
    undo: performUndo,
    redo: performRedo,
    clear,
    historyCount: past.length,
  };
}

/**
 * Apply a history action in undo or redo direction.
 * The state to restore is taken from `before` (undo) or `after` (redo).
 */
function applyHistoryAction(
  action: HistoryAction,
  direction: 'undo' | 'redo',
  updateCurrentPlot: (updates: Partial<Plot>) => void,
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved' | 'error') => void
): void {
  const stateToApply = direction === 'undo' ? action.before : action.after;

  switch (action.type) {
    case 'UPDATE_PLOT':
      updateCurrentPlot(stateToApply as Partial<Plot>);
      setSaveStatus('unsaved');
      break;
    // Future action types (CREATE_ENTITY, UPDATE_ENTITY, etc.) will be handled here in Phase 2
    default:
      break;
  }
}
