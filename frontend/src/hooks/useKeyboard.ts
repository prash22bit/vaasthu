import { useEffect } from 'react';
import { useHistory } from './useHistory';
import { useProjectStore } from '../stores/projectStore';
import { useCanvasStore } from '../stores/canvasStore';
import { useUIStore } from '../stores/uiStore';
import { useHistoryStore, createHistoryAction } from '../stores/historyStore';

/**
 * Global keyboard shortcut handler.
 * Attaches to the document level so shortcuts work regardless of focus.
 */
export function useKeyboard() {
  const { undo, redo, canUndo, canRedo } = useHistory();
  const { saveCurrentProject, currentProject, deleteEntities, duplicateEntities } = useProjectStore();
  const { selectedEntityIds, clearSelection, drawingState, setDrawingState } = useCanvasStore();
  const { setActiveTool } = useUIStore();
  const pushHistory = useHistoryStore((s) => s.push);

  useEffect(() => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const meta = isMac ? e.metaKey : e.ctrlKey;

      // Ignore shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const keyLower = e.key.toLowerCase();

      // ── Save: Ctrl/Cmd + S ──
      if (meta && keyLower === 's') {
        e.preventDefault();
        saveCurrentProject().catch(console.error);
        return;
      }

      // ── Duplicate: Ctrl/Cmd + D ──
      if (meta && keyLower === 'd') {
        e.preventDefault();
        if (selectedEntityIds.length > 0 && currentProject) {
          const entitiesBefore = [...(currentProject.floors[0]?.entities || [])];
          const newIds = duplicateEntities(selectedEntityIds);
          const entitiesAfter = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];

          pushHistory(
            createHistoryAction('CREATE_ENTITY', entitiesBefore, entitiesAfter, `Duplicate ${selectedEntityIds.length} object(s)`)
          );

          if (newIds.length > 0) {
            useCanvasStore.getState().setSelectedEntities(newIds);
          }
        }
        return;
      }

      // ── Undo: Ctrl/Cmd + Z ──
      if (meta && keyLower === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
        return;
      }

      // ── Redo: Ctrl/Cmd + Y (Windows) or Ctrl/Cmd + Shift + Z (Mac) ──
      if ((meta && keyLower === 'y') || (meta && e.shiftKey && keyLower === 'z')) {
        e.preventDefault();
        if (canRedo) redo();
        return;
      }

      // ── Tool Shortcuts (without Ctrl/Cmd modifier) ──
      if (!meta && !e.shiftKey && !e.altKey) {
        if (keyLower === 'v') {
          e.preventDefault();
          setActiveTool('select');
          return;
        }
        if (keyLower === 'w') {
          e.preventDefault();
          setActiveTool('wall');
          return;
        }
        if (keyLower === 'r') {
          e.preventDefault();
          setActiveTool('room');
          return;
        }
        if (keyLower === 'd') {
          e.preventDefault();
          setActiveTool('dimension');
          return;
        }
        if (keyLower === 'h') {
          e.preventDefault();
          setActiveTool('pan');
          return;
        }
      }

      // ── Escape: cancel active drawing or clear selection ──
      if (e.key === 'Escape') {
        e.preventDefault();
        if (drawingState.isDrawing) {
          setDrawingState({ isDrawing: false, startPoint: null, currentPoint: null });
        } else {
          clearSelection();
          setActiveTool('select');
        }
        return;
      }

      // ── Delete/Backspace: delete selected entities ──
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEntityIds.length > 0 && currentProject) {
          e.preventDefault();
          const entitiesBefore = [...(currentProject.floors[0]?.entities || [])];
          deleteEntities(selectedEntityIds);
          const entitiesAfter = [...(useProjectStore.getState().currentProject?.floors[0]?.entities || [])];

          pushHistory(
            createHistoryAction('DELETE_ENTITY', entitiesBefore, entitiesAfter, `Delete ${selectedEntityIds.length} object(s)`)
          );
          clearSelection();
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    undo,
    redo,
    canUndo,
    canRedo,
    saveCurrentProject,
    currentProject,
    selectedEntityIds,
    clearSelection,
    drawingState,
    setDrawingState,
    setActiveTool,
    deleteEntities,
    duplicateEntities,
    pushHistory,
  ]);
}
