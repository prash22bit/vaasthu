/**
 * VastuScoreCard.tsx — Vastu Guidance Score Display
 */
import React from 'react';
import { formatScoreLabel } from '../vastuUtils';

interface VastuScoreCardProps {
  score: number;
}

const scoreGradient = (score: number): string => {
  if (score >= 85) return 'from-emerald-500 to-emerald-600';
  if (score >= 70) return 'from-sky-500 to-sky-600';
  if (score >= 55) return 'from-amber-500 to-amber-600';
  return 'from-rose-500 to-rose-600';
};

const scoreTextColor = (score: number): string => {
  if (score >= 85) return 'text-emerald-400';
  if (score >= 70) return 'text-sky-400';
  if (score >= 55) return 'text-amber-400';
  return 'text-rose-400';
};

export const VastuScoreCard: React.FC<VastuScoreCardProps> = ({ score }) => {
  const label = formatScoreLabel(score);
  const textColor = scoreTextColor(score);
  const gradient = scoreGradient(score);

  return (
    <div className="bg-surface rounded-lg p-3 border border-panel-border">
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`text-3xl font-bold tabular-nums ${textColor}`}>{score}</span>
        <span className="text-text-muted text-sm">/ 100</span>
        <span className={`ml-auto text-xs font-semibold ${textColor}`}>{label}</span>
      </div>

      {/* Score bar */}
      <div className="w-full bg-panel-border rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="text-text-muted text-[9px] mt-1.5 leading-tight">
        Vastu Guidance Score — traditional cultural guidance
      </p>
    </div>
  );
};
