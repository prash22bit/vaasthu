/**
 * VastuRuleResults.tsx — Scrollable list of Vastu rule results
 * Clickable results select + focus the entity on the canvas.
 */
import React, { useState } from 'react';
import type { VastuRuleResult, VastuRuleCategory } from '@vastuplan/shared';
import { statusColorClass, formatDirection } from '../vastuUtils';
import { useCanvasStore } from '../../../stores/canvasStore';

interface VastuRuleResultsProps {
  ruleResults: VastuRuleResult[];
  filterCategory?: VastuRuleCategory | null;
}

export const VastuRuleResults: React.FC<VastuRuleResultsProps> = ({
  ruleResults,
  filterCategory,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { setSelectedEntity, fitToPlot } = useCanvasStore();

  const filtered = filterCategory
    ? ruleResults.filter((r) => r.ruleCategory === filterCategory)
    : ruleResults;

  // Exclude not-applicable unless there's nothing else
  const actionable = filtered.filter((r) => r.status !== 'not-applicable' && r.entityId);
  const shown = actionable.length > 0 ? actionable : filtered.slice(0, 10);

  if (shown.length === 0) {
    return (
      <p className="text-text-muted text-xs px-2 py-3 text-center">
        No rule results to display.
      </p>
    );
  }

  const handleResultClick = (result: VastuRuleResult) => {
    if (!result.entityId) return;
    // Select and focus entity on canvas
    setSelectedEntity(result.entityId, result.entityType as import('@vastuplan/shared').DesignEntityType);
    const expanded = expandedId === result.entityId + result.ruleId
      ? null
      : result.entityId + result.ruleId;
    setExpandedId(expanded);
  };

  return (
    <div className="flex flex-col gap-0.5">
      {shown.map((result) => {
        const key = result.entityId + result.ruleId;
        const isExpanded = expandedId === key;
        const colorClass = statusColorClass(result.status);

        const icon =
          result.status === 'preferred' ? '✓'
          : result.status === 'acceptable' || result.status === 'pass' ? '○'
          : result.status === 'warning' ? '⚠'
          : result.status === 'violation' ? '✕'
          : '—';

        return (
          <div key={key} className="border border-transparent hover:border-panel-border rounded transition-colors">
            <button
              className="w-full flex items-start gap-2 px-2 py-1.5 text-left"
              onClick={() => handleResultClick(result)}
              aria-label={`${result.entityLabel}: ${result.message}`}
            >
              <span className={`text-xs font-mono shrink-0 mt-0.5 ${colorClass}`}>{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-text-primary text-xs font-medium truncate">
                    {result.entityLabel}
                  </span>
                  {result.currentZone && (
                    <span className="text-text-muted text-[9px] shrink-0">
                      {formatDirection(result.currentZone)}
                    </span>
                  )}
                </div>
                <p className="text-text-secondary text-[10px] leading-tight mt-0.5 line-clamp-2">
                  {result.message}
                </p>
              </div>
              <span className={`text-[9px] font-mono shrink-0 mt-0.5 ${colorClass}`}>
                {result.scoreImpact > 0 ? '+' : ''}{result.scoreImpact !== 0 ? result.scoreImpact : ''}
              </span>
            </button>

            {isExpanded && (
              <div className="px-3 pb-2 border-t border-panel-border/50 mt-0.5">
                <p className="text-text-muted text-[10px] leading-relaxed mt-1.5">
                  {result.explanation}
                </p>
                {result.recommendation && result.status !== 'preferred' && (
                  <p className="text-sky-400/80 text-[10px] leading-relaxed mt-1.5 italic">
                    💡 {result.recommendation}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
