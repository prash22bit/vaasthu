/**
 * VastuSettingsPanel.tsx — Vastu Analysis Settings
 */
import React from 'react';
import type { VastuSettings, VastuStrictness } from '@vastuplan/shared';
import { useVastuStore } from '../vastuStore';

export const VastuSettingsPanel: React.FC = () => {
  const { vastuSettings, updateSettings } = useVastuStore();

  const strictnessOptions: { value: VastuStrictness; label: string; desc: string }[] = [
    { value: 'relaxed',  label: 'Relaxed',  desc: 'Core rules only' },
    { value: 'balanced', label: 'Balanced', desc: 'Recommended' },
    { value: 'strict',   label: 'Strict',   desc: 'All guidelines' },
  ];

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Strictness */}
      <div>
        <label className="text-text-muted text-[10px] uppercase tracking-wider mb-1.5 block">
          Guideline Strictness
        </label>
        <div className="grid grid-cols-3 gap-1">
          {strictnessOptions.map((opt) => (
            <button
              key={opt.value}
              className={`flex flex-col items-center py-1.5 px-1 rounded border text-xs transition-colors ${
                vastuSettings.strictness === opt.value
                  ? 'border-brand-500 bg-brand-500/20 text-brand-400'
                  : 'border-panel-border text-text-muted hover:text-text-secondary hover:border-panel-border/80'
              }`}
              onClick={() => updateSettings({ strictness: opt.value })}
            >
              <span className="font-medium">{opt.label}</span>
              <span className="text-[9px] opacity-70">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Rule Set */}
      <div>
        <label className="text-text-muted text-[10px] uppercase tracking-wider mb-1 block">
          Rule Set
        </label>
        <div className="bg-surface rounded px-2 py-1.5 text-xs text-text-secondary border border-panel-border">
          {vastuSettings.ruleSetId}
          <span className="ml-1 text-text-muted text-[9px]">(traditional)</span>
        </div>
      </div>

      {/* Toggle options */}
      <div className="flex flex-col gap-1.5">
        {[
          { key: 'showHeatmap' as keyof VastuSettings, label: 'Show Zone Heatmap' },
          { key: 'showEntityHighlights' as keyof VastuSettings, label: 'Highlight Entities' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={vastuSettings[key] as boolean}
              onChange={(e) => updateSettings({ [key]: e.target.checked } as Partial<VastuSettings>)}
              className="w-3 h-3 rounded accent-brand-500"
            />
            <span className="text-text-secondary text-xs group-hover:text-text-primary transition-colors">
              {label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};
