/**
 * vastuStore.ts — Vastu UI State (Zustand)
 *
 * Responsibilities:
 *   - Track Vastu ON/OFF toggle
 *   - Hold the last VastuAnalysis snapshot
 *   - Track analysis settings
 *
 * NOT responsible for:
 *   - Modifying the CAD design (strictly read-only)
 *   - Persisting to MongoDB (analysis is transient)
 *
 * Stale detection:
 *   isStale is computed in the VastuPanel component by comparing
 *   the current project's design hash against analysis.designHash.
 *   This avoids manual markStale() calls scattered across inspectors.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { VastuAnalysis, VastuSettings } from '@vastuplan/shared';
import { DEFAULT_VASTU_SETTINGS } from '@vastuplan/shared';
import { analyzeVastu } from './vastuEngine';
import type { Project } from '@vastuplan/shared';

interface VastuStore {
  /** Whether the Vastu Analysis panel is active */
  isVastuActive: boolean;
  /** The most recent analysis snapshot (null = not yet run) */
  vastuAnalysis: VastuAnalysis | null;
  /** Whether analysis is currently running */
  isAnalyzing: boolean;
  /** Analysis settings (rule set, zone system, strictness) */
  vastuSettings: VastuSettings;
  /** Which floor index is being analyzed */
  selectedFloorIndex: number;

  // Actions
  toggleVastu: () => void;
  setVastuActive: (active: boolean) => void;
  runAnalysis: (project: Project, floorIndex?: number) => void;
  updateSettings: (partial: Partial<VastuSettings>) => void;
  setSelectedFloorIndex: (index: number) => void;
  clearAnalysis: () => void;
}

export const useVastuStore = create<VastuStore>()(
  immer((set, get) => ({
    isVastuActive: false,
    vastuAnalysis: null,
    isAnalyzing: false,
    vastuSettings: DEFAULT_VASTU_SETTINGS,
    selectedFloorIndex: 0,

    toggleVastu: () => set((s) => {
      s.isVastuActive = !s.isVastuActive;
    }),

    setVastuActive: (active) => set((s) => {
      s.isVastuActive = active;
    }),

    /**
     * Run the Vastu analysis synchronously.
     *
     * The analyzeVastu() function is deterministic and pure —
     * no async operations needed for Phase 4.
     * Analysis runs in <5ms for typical floor plans.
     *
     * IMPORTANT: This function is read-only. It NEVER calls
     * addEntity(), updateEntity(), deleteEntities(), or saveCurrentProject().
     */
    runAnalysis: (project: Project, floorIndex?: number) => {
      const { vastuSettings, selectedFloorIndex } = get();
      const idx = floorIndex ?? selectedFloorIndex;

      set((s) => { s.isAnalyzing = true; });

      try {
        // analyzeVastu is pure — safe to call synchronously
        const analysis = analyzeVastu(project, idx, vastuSettings);
        set((s) => {
          s.vastuAnalysis = analysis as unknown as typeof s.vastuAnalysis;
          s.isAnalyzing = false;
          s.selectedFloorIndex = idx;
        });
      } catch (err) {
        console.error('[VastuEngine] Analysis failed:', err);
        set((s) => { s.isAnalyzing = false; });
      }
    },

    updateSettings: (partial) => set((s) => {
      Object.assign(s.vastuSettings, partial);
    }),

    setSelectedFloorIndex: (index) => set((s) => {
      s.selectedFloorIndex = index;
    }),

    clearAnalysis: () => set((s) => {
      s.vastuAnalysis = null;
    }),
  }))
);
