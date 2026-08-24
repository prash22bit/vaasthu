import React from 'react';
import type { AIProposal } from '@vastuplan/shared';
import { Check, X, Eye, EyeOff, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { AICommandList } from './AICommandList';
import { AIValidationErrors } from './AIValidationErrors';
import { useAIStore } from '../aiStore';

interface AIProposalCardProps {
  proposal: AIProposal;
  isApplied?: boolean;
}

export const AIProposalCard: React.FC<AIProposalCardProps> = ({ proposal, isApplied = false }) => {
  const {
    approveProposal,
    rejectProposal,
    isValidating,
    isPreviewVisible,
    togglePreviewVisibility,
  } = useAIStore();

  const isValid = proposal.status === 'valid';
  const isInvalid = proposal.status === 'invalid';
  const isRejected = proposal.status === 'rejected';
  const hasVastuImpact =
    proposal.currentVastuScore !== undefined &&
    proposal.proposedVastuScore !== undefined;

  const scoreDelta = hasVastuImpact
    ? (proposal.proposedVastuScore! - proposal.currentVastuScore!)
    : 0;

  return (
    <div
      className={`
        mt-2 p-3 rounded-lg border text-left space-y-2.5 transition-all
        ${
          isApplied
            ? 'bg-emerald-950/20 border-emerald-500/40'
            : isRejected
            ? 'bg-surface/30 border-panel-border opacity-60'
            : isInvalid
            ? 'bg-error/10 border-error/30'
            : 'bg-brand-950/20 border-brand-500/40 shadow-sm'
        }
      `}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className={isValid ? 'text-brand-400' : 'text-text-muted'} />
          <span className="text-xs font-semibold text-text-primary">
            {proposal.title}
          </span>
        </div>

        {/* Status Badge */}
        {isApplied ? (
          <span className="text-3xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            APPLIED
          </span>
        ) : isRejected ? (
          <span className="text-3xs font-semibold px-1.5 py-0.5 rounded bg-surface text-text-muted border border-panel-border">
            REJECTED
          </span>
        ) : isInvalid ? (
          <span className="text-3xs font-semibold px-1.5 py-0.5 rounded bg-error/20 text-error border border-error/30">
            INVALID
          </span>
        ) : (
          <span className="text-3xs font-semibold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
            PROPOSAL
          </span>
        )}
      </div>

      {/* ── Explanation ── */}
      <p className="text-text-secondary text-2xs leading-relaxed">
        {proposal.explanation}
      </p>

      {/* ── Vastu Impact Badge (if available) ── */}
      {hasVastuImpact && (
        <div className="flex items-center justify-between p-2 rounded bg-surface/80 border border-panel-border text-2xs">
          <div className="flex items-center gap-1 text-text-muted">
            <span>🔯 Vastu Impact:</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-text-secondary">{proposal.currentVastuScore}</span>
            <span className="text-text-muted">→</span>
            <span className="text-text-primary font-bold">{proposal.proposedVastuScore}</span>
            {scoreDelta > 0 && (
              <span className="text-success font-semibold flex items-center gap-0.5">
                <TrendingUp size={11} />
                +{scoreDelta}
              </span>
            )}
            {scoreDelta < 0 && (
              <span className="text-error font-semibold">
                {scoreDelta}
              </span>
            )}
            {scoreDelta === 0 && (
              <span className="text-text-muted">(no change)</span>
            )}
          </div>
        </div>
      )}

      {/* ── Commands List ── */}
      <AICommandList commands={proposal.commands} />

      {/* ── Validation Errors / Warnings ── */}
      <AIValidationErrors
        errors={proposal.validationErrors}
        warnings={proposal.warnings}
      />

      {/* ── Actions (only active when pending/valid) ── */}
      {!isApplied && !isRejected && (
        <div className="pt-2 border-t border-panel-border flex items-center justify-between gap-1.5">
          {/* Preview Toggle */}
          <button
            type="button"
            className={`btn btn-xs gap-1 ${isPreviewVisible ? 'btn-secondary text-brand-400' : 'btn-ghost'}`}
            onClick={togglePreviewVisibility}
            title={isPreviewVisible ? 'Hide Preview Overlay' : 'Show Preview Overlay'}
          >
            {isPreviewVisible ? <Eye size={12} /> : <EyeOff size={12} />}
            <span className="text-3xs">{isPreviewVisible ? 'Previewing' : 'Preview'}</span>
          </button>

          <div className="flex items-center gap-1">
            {/* Reject */}
            <button
              type="button"
              className="btn btn-ghost btn-xs text-text-muted hover:text-error gap-0.5"
              onClick={rejectProposal}
              disabled={isValidating}
            >
              <X size={12} />
              <span className="text-3xs">Reject</span>
            </button>

            {/* Apply */}
            <button
              type="button"
              className="btn btn-primary btn-xs gap-1 bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white font-medium"
              onClick={() => approveProposal(0)}
              disabled={!isValid || isValidating}
            >
              <Check size={12} />
              <span className="text-3xs">Apply Changes</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
