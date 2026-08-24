/**
 * VastuCategoryScore.tsx — Single category score row
 */
import React from 'react';
import type { VastuCategoryScore as VastuCategoryScoreType } from '@vastuplan/shared';
import { statusColorClass, severityIcon } from '../vastuUtils';

interface VastuCategoryScoreProps {
  categoryScore: VastuCategoryScoreType;
  onClick?: () => void;
}

export const VastuCategoryScore: React.FC<VastuCategoryScoreProps> = ({
  categoryScore,
  onClick,
}) => {
  const { label, score, status } = categoryScore;
  const colorClass = statusColorClass(status);

  const icon =
    status === 'preferred' || status === 'pass' ? '✓'
    : status === 'warning' ? '⚠'
    : status === 'violation' ? '✕'
    : status === 'not-applicable' ? '—'
    : '○';

  const barColor =
    score >= 80 ? 'bg-emerald-500'
    : score >= 60 ? 'bg-sky-500'
    : score >= 40 ? 'bg-amber-500'
    : 'bg-rose-500';

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-surface transition-colors text-left group"
    >
      <span className={`text-xs font-mono w-3 shrink-0 ${colorClass}`}>{icon}</span>
      <span className="text-text-secondary text-xs flex-1 truncate group-hover:text-text-primary transition-colors">
        {label}
      </span>
      <span className={`text-xs font-mono tabular-nums ${colorClass} shrink-0`}>
        {status === 'not-applicable' ? '—' : score}
      </span>
      <div className="w-10 h-1 bg-panel-border rounded-full overflow-hidden shrink-0">
        {status !== 'not-applicable' && (
          <div
            className={`h-full rounded-full ${barColor} transition-all`}
            style={{ width: `${score}%` }}
          />
        )}
      </div>
    </button>
  );
};
