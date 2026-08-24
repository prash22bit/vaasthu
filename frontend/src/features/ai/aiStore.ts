// =============================================================================
// VastuPlan — AI Store (Zustand)
//
// Manages AI conversation state, proposal status, validation, and preview.
//
// INVARIANTS:
//   - Ephemeral chat state (lost on page refresh, no unsolicited writes)
//   - NEVER mutates projectStore directly from chat/preview
//   - Only approveProposal() commits changes via executeProposalAtomically()
// =============================================================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  AIChatMessage,
  AIProposal,
  Project,
} from '@vastuplan/shared';
import { sendChatMessage } from './aiService';
import { buildAIDesignContext } from './aiContext';
import { validateProposal } from './aiCommandValidator';
import { generateProposalPreview, ProposalPreviewResult } from './aiProposalPreview';
import { executeProposalAtomically } from './aiProposalExecutor';
import { useVastuStore } from '../vastu/vastuStore';

interface AIStore {
  // State
  isAIActive: boolean;
  messages: AIChatMessage[];
  activeProposal: AIProposal | null;
  previewResult: ProposalPreviewResult | null;
  isGenerating: boolean;
  isValidating: boolean;
  isPreviewVisible: boolean;
  error: string | null;

  // Actions
  openAI: () => void;
  closeAI: () => void;
  toggleAI: () => void;
  setAIActive: (active: boolean) => void;
  sendMessage: (
    text: string,
    project: Project,
    floorIndex?: number,
    selectedEntityIds?: string[]
  ) => Promise<void>;
  previewProposal: (proposal: AIProposal, project: Project, floorIndex?: number) => void;
  togglePreviewVisibility: () => void;
  approveProposal: (floorIndex?: number) => Promise<boolean>;
  rejectProposal: () => void;
  clearChat: () => void;
  clearError: () => void;
}

export const useAIStore = create<AIStore>()(
  immer((set, get) => ({
    // ── Initial State ──
    isAIActive: false,
    messages: [],
    activeProposal: null,
    previewResult: null,
    isGenerating: false,
    isValidating: false,
    isPreviewVisible: true,
    error: null,

    // ── Actions ──
    openAI: () => set((s) => { s.isAIActive = true; }),
    closeAI: () => set((s) => { s.isAIActive = false; }),
    toggleAI: () => set((s) => { s.isAIActive = !s.isAIActive; }),
    setAIActive: (active) => set((s) => { s.isAIActive = active; }),

    sendMessage: async (text, project, floorIndex = 0, selectedEntityIds = []) => {
      const userText = text.trim();
      if (!userText) return;

      const userMsg: AIChatMessage = {
        id: `msg_user_${Date.now()}`,
        role: 'user',
        content: userText,
        timestamp: new Date().toISOString(),
      };

      set((s) => {
        s.messages.push(userMsg);
        s.isGenerating = true;
        s.error = null;
      });

      try {
        const vastuAnalysis = useVastuStore.getState().vastuAnalysis;
        const context = buildAIDesignContext(project, floorIndex, selectedEntityIds, vastuAnalysis);

        const currentHistory = get().messages;
        const response = await sendChatMessage({
          message: userText,
          context,
          conversationHistory: currentHistory,
        });

        let proposal = response.proposal;

        // If response includes a proposal, validate and preview it
        let previewRes: ProposalPreviewResult | null = null;
        if (proposal) {
          const validation = validateProposal(proposal, project, floorIndex);
          proposal.validationErrors = validation.errors;
          proposal.warnings = validation.warnings;
          proposal.status = validation.isValid ? 'valid' : 'invalid';

          if (validation.isValid) {
            try {
              previewRes = generateProposalPreview(project, proposal, floorIndex);
              proposal.currentVastuScore = previewRes.currentVastuScore;
              proposal.proposedVastuScore = previewRes.proposedVastuScore;
            } catch (pErr) {
              console.warn('[AIStore] Preview generation failed:', pErr);
            }
          }
        }

        const assistantMsg: AIChatMessage = {
          id: `msg_asst_${Date.now()}`,
          role: 'assistant',
          content: response.message,
          proposal,
          timestamp: new Date().toISOString(),
        };

        set((s) => {
          s.messages.push(assistantMsg);
          s.isGenerating = false;
          if (proposal) {
            s.activeProposal = proposal;
            s.previewResult = previewRes;
            s.isPreviewVisible = true;
          }
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'AI assistant error';
        set((s) => {
          s.isGenerating = false;
          s.error = errorMessage;
          s.messages.push({
            id: `msg_err_${Date.now()}`,
            role: 'assistant',
            content: `⚠️ ${errorMessage}`,
            timestamp: new Date().toISOString(),
          });
        });
      }
    },

    previewProposal: (proposal, project, floorIndex = 0) => {
      set((s) => { s.isValidating = true; });
      try {
        const validation = validateProposal(proposal, project, floorIndex);
        proposal.validationErrors = validation.errors;
        proposal.warnings = validation.warnings;
        proposal.status = validation.isValid ? 'valid' : 'invalid';

        let previewRes: ProposalPreviewResult | null = null;
        if (validation.isValid) {
          previewRes = generateProposalPreview(project, proposal, floorIndex);
          proposal.currentVastuScore = previewRes.currentVastuScore;
          proposal.proposedVastuScore = previewRes.proposedVastuScore;
        }

        set((s) => {
          s.activeProposal = proposal;
          s.previewResult = previewRes;
          s.isValidating = false;
          s.isPreviewVisible = true;
        });
      } catch (err) {
        set((s) => {
          s.isValidating = false;
          s.error = err instanceof Error ? err.message : 'Preview calculation failed';
        });
      }
    },

    togglePreviewVisibility: () => set((s) => {
      s.isPreviewVisible = !s.isPreviewVisible;
    }),

    approveProposal: async (floorIndex = 0) => {
      const { activeProposal } = get();
      if (!activeProposal || activeProposal.status !== 'valid') {
        return false;
      }

      set((s) => { s.isValidating = true; });

      try {
        const result = await executeProposalAtomically(activeProposal, floorIndex);

        if (result.success) {
          set((s) => {
            if (s.activeProposal) {
              s.activeProposal.status = 'applied';
            }
            s.activeProposal = null;
            s.previewResult = null;
            s.isValidating = false;
            s.messages.push({
              id: `msg_sys_${Date.now()}`,
              role: 'system',
              content: `✅ Applied design changes (${result.appliedCount} action(s)). You can undo with ⌘Z / Ctrl+Z.`,
              timestamp: new Date().toISOString(),
            });
          });
          return true;
        } else {
          set((s) => {
            s.isValidating = false;
            s.error = result.message;
            if (s.activeProposal) {
              s.activeProposal.status = 'invalid';
            }
          });
          return false;
        }
      } catch (err) {
        set((s) => {
          s.isValidating = false;
          s.error = err instanceof Error ? err.message : 'Failed to apply proposal';
        });
        return false;
      }
    },

    rejectProposal: () => {
      set((s) => {
        if (s.activeProposal) {
          s.activeProposal.status = 'rejected';
        }
        s.activeProposal = null;
        s.previewResult = null;
      });
    },

    clearChat: () => set((s) => {
      s.messages = [];
      s.activeProposal = null;
      s.previewResult = null;
      s.error = null;
    }),

    clearError: () => set((s) => {
      s.error = null;
    }),
  }))
);
