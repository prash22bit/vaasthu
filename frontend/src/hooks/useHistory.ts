import { useHistoryStore } from '../stores/historyStore';
import { useProjectStore } from '../stores/projectStore';
import type { HistoryAction, Plot, DesignEntity } from '@vastuplan/shared';

/**
 * Hook for undo/redo operations with integrated project state restoration.
 */
export function useHistory() {
  const { past, future, canUndo, canRedo, undo, redo, clear } = useHistoryStore();
  const projectStore = useProjectStore();

  const performUndo = () => {
    const action = undo();
    if (!action) return;
    applyHistoryAction(action, 'undo', projectStore);
  };

  const performRedo = () => {
    const action = redo();
    if (!action) return;
    applyHistoryAction(action, 'redo', projectStore);
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
  projectStore: ReturnType<typeof useProjectStore.getState>
): void {
  const stateToApply = direction === 'undo' ? action.before : action.after;

  switch (action.type) {
    case 'UPDATE_PLOT':
      projectStore.updateCurrentPlot(stateToApply as Partial<Plot>);
      break;

    case 'CREATE_ENTITY':
    case 'DELETE_ENTITY':
    case 'UPDATE_ENTITY':
    case 'MOVE_ENTITY':
    case 'RESIZE_ENTITY':
    case 'ROTATE_ENTITY': {
      // Snapshot-based restoration of floor entities
      const entitiesSnapshot = stateToApply as DesignEntity[];
      if (Array.isArray(entitiesSnapshot) && projectStore.currentProject) {
        useProjectStore.setState((state) => {
          if (state.currentProject && state.currentProject.floors[0]) {
            state.currentProject.floors[0].entities = entitiesSnapshot;
            state.saveStatus = 'unsaved';
          }
        });
      }
      break;
    }

    default:
      break;
  }
}
