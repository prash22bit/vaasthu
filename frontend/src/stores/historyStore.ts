import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { HistoryAction, HistoryActionType } from '@vastuplan/shared';
import { HISTORY_MAX_STEPS } from '../constants';

interface HistoryStore {
  past: HistoryAction[];
  future: HistoryAction[];
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  push: (action: HistoryAction) => void;
  undo: () => HistoryAction | null;
  redo: () => HistoryAction | null;
  clear: () => void;
}

/**
 * Helper to generate a HistoryAction.
 */
export function createHistoryAction(
  type: HistoryActionType,
  before: unknown,
  after: unknown,
  description: string
): HistoryAction {
  return {
    id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    timestamp: Date.now(),
    before,
    after,
    description,
  };
}

export const useHistoryStore = create<HistoryStore>()(
  immer((set, get) => ({
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,

    // ── Push a new action onto the history stack ──
    push: (action: HistoryAction) => {
      set((s) => {
        // When a new action is added, the redo future is cleared
        s.future = [];
        s.past.push(action);
        // Cap history at max steps
        if (s.past.length > HISTORY_MAX_STEPS) {
          s.past.shift();
        }
        s.canUndo = s.past.length > 0;
        s.canRedo = false;
      });
    },

    // ── Undo — returns the action that was undone ──
    undo: () => {
      const { past } = get();
      if (past.length === 0) return null;
      const action = past[past.length - 1];

      set((s) => {
        const popped = s.past.pop();
        if (popped) {
          s.future.unshift(popped);
        }
        s.canUndo = s.past.length > 0;
        s.canRedo = s.future.length > 0;
      });

      return action;
    },

    // ── Redo — returns the action that was re-applied ──
    redo: () => {
      const { future } = get();
      if (future.length === 0) return null;
      const action = future[0];

      set((s) => {
        const shifted = s.future.shift();
        if (shifted) {
          s.past.push(shifted);
        }
        s.canUndo = s.past.length > 0;
        s.canRedo = s.future.length > 0;
      });

      return action;
    },

    // ── Clear all history ──
    clear: () => {
      set((s) => { s.past = []; s.future = []; s.canUndo = false; s.canRedo = false; });
    },
  }))
);
