import { useEffect } from 'react';
import { useHistory } from './useHistory';
import { useProjectStore } from '../stores/projectStore';
import { useCanvasStore } from '../stores/canvasStore';

/**
 * Global keyboard shortcut handler.
 * Attaches to the document level so shortcuts work regardless of focus.
 */
export function useKeyboard() {
  const { undo, redo, canUndo, canRedo } = useHistory();
  const saveCurrentProject = useProjectStore((s) => s.saveCurrentProject);
  const clearSelection = useCanvasStore((s) => s.clearSelection);

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

      // ── Save: Ctrl/Cmd + S ──
      if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveCurrentProject().catch(console.error);
        return;
      }

      // ── Undo: Ctrl/Cmd + Z ──
      if (meta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
        return;
      }

      // ── Redo: Ctrl/Cmd + Y (Windows) or Ctrl/Cmd + Shift + Z (Mac) ──
      if ((meta && e.key.toLowerCase() === 'y') || (meta && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        if (canRedo) redo();
        return;
      }

      // ── Escape: cancel operation / clear selection ──
      if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
        return;
      }

      // ── Delete/Backspace: delete selected entity ──
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Will be implemented in Phase 2 when entities are deletable
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, saveCurrentProject, clearSelection]);
}
