/**
 * VastuRecommendations.tsx — Structured recommendation cards
 */
import React from 'react';
import type { VastuRecommendation } from '@vastuplan/shared';
import { VASTU_DIRECTION_LABELS } from '@vastuplan/shared';
import { useCanvasStore } from '../../../stores/canvasStore';

interface VastuRecommendationsProps {
  recommendations: VastuRecommendation[];
}

export const VastuRecommendations: React.FC<VastuRecommendationsProps> = ({
  recommendations,
}) => {
  const { setSelectedEntity } = useCanvasStore();

  if (recommendations.length === 0) {
    return (
      <div className="px-2 py-3 text-center">
        <p className="text-emerald-400 text-xs font-medium">✓ No significant concerns</p>
        <p className="text-text-muted text-[10px] mt-1">
          Traditional Vastu placement looks good.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {recommendations.map((rec) => {
        const isCritical = rec.severity === 'critical';
        const borderColor = isCritical ? 'border-rose-800/50' : 'border-amber-800/40';
        const bgColor = isCritical ? 'bg-rose-950/30' : 'bg-amber-950/20';
        const dotColor = isCritical ? 'bg-rose-400' : 'bg-amber-400';

        const preferredLabels = rec.preferredZones
          .map((z) => VASTU_DIRECTION_LABELS[z] ?? z)
          .join(', ');

        const currentLabel = rec.currentZone
          ? VASTU_DIRECTION_LABELS[rec.currentZone] ?? rec.currentZone
          : 'Unknown';

        return (
          <div
            key={rec.ruleId + rec.entityId}
            className={`rounded border ${borderColor} ${bgColor} p-2`}
          >
            <div className="flex items-start gap-1.5 mb-1">
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0 mt-1.5`} />
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-xs font-medium">{rec.entityLabel}</p>
                <p className="text-text-muted text-[9px]">
                  Current: {currentLabel}
                  {preferredLabels && ` → Preferred: ${preferredLabels}`}
                </p>
              </div>
            </div>

            <p className="text-text-secondary text-[10px] leading-relaxed pl-3">
              {rec.issue}
            </p>

            {rec.entityId && (
              <button
                className="mt-1.5 ml-3 text-[9px] text-sky-400 hover:text-sky-300 transition-colors"
                onClick={() => setSelectedEntity(rec.entityId, rec.entityType)}
              >
                → View on Plan
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
