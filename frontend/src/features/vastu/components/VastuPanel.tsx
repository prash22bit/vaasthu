/**
 * VastuPanel.tsx — Vastu Analysis Right Panel
 *
 * Stale detection is computed here via designHash comparison —
 * no manual markStale() calls required from individual inspectors.
 * Whenever the project changes, the panel automatically detects it.
 */
import React, { useMemo, useState } from 'react';
import { Settings, X, RefreshCw, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import type { Project, VastuRuleCategory } from '@vastuplan/shared';
import { useVastuStore } from '../vastuStore';
import { computeDesignHash } from '../vastuUtils';
import { VastuDisclaimer } from './VastuDisclaimer';
import { VastuScoreCard } from './VastuScoreCard';
import { VastuCategoryScore } from './VastuCategoryScore';
import { VastuRuleResults } from './VastuRuleResults';
import { VastuRecommendations } from './VastuRecommendations';
import { VastuSettingsPanel } from './VastuSettingsPanel';

interface VastuPanelProps {
  project: Project;
  floorIndex?: number;
}

type ActiveSection = 'categories' | 'rules' | 'recommendations' | 'settings';

export const VastuPanel: React.FC<VastuPanelProps> = ({ project, floorIndex = 0 }) => {
  const {
    vastuAnalysis,
    isAnalyzing,
    runAnalysis,
    setVastuActive,
    vastuSettings,
  } = useVastuStore();

  const [showSettings, setShowSettings] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>('categories');
  const [filterCategory, setFilterCategory] = useState<VastuRuleCategory | null>(null);

  // ── Automatic stale detection ──────────────────────────────────────────────
  // Derived purely from project state vs last analysis hash.
  // No manual markStale() calls needed anywhere in the codebase.
  const currentHash = useMemo(
    () => computeDesignHash(project, floorIndex),
    [project, floorIndex]
  );

  const isStale = useMemo(
    () => vastuAnalysis !== null && currentHash !== vastuAnalysis.designHash,
    [vastuAnalysis, currentHash]
  );

  const hasAnalysis = vastuAnalysis !== null;

  const handleAnalyze = () => {
    runAnalysis(project, floorIndex);
  };

  const handleCategoryClick = (category: VastuRuleCategory) => {
    setFilterCategory(filterCategory === category ? null : category);
    setActiveSection('rules');
  };

  const toggleSection = (section: ActiveSection) => {
    setActiveSection(activeSection === section ? 'categories' : section);
  };

  return (
    <div className="w-72 flex flex-col bg-panel-bg border-l border-panel-border overflow-hidden shrink-0 z-10">

      {/* Header */}
      <div className="h-10 flex items-center gap-2 px-3 border-b border-panel-border shrink-0">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-brand-400 text-sm">🔯</span>
          <span className="text-text-primary text-sm font-semibold truncate">Vastu Analysis</span>
        </div>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
          aria-label="Vastu settings"
        >
          <Settings size={13} />
        </button>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setVastuActive(false)}
          title="Close Vastu panel"
          aria-label="Close Vastu analysis"
        >
          <X size={13} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* Settings panel (collapsible) */}
        {showSettings && (
          <div className="border-b border-panel-border">
            <VastuSettingsPanel />
          </div>
        )}

        <div className="flex flex-col gap-0 p-2">

          {/* Disclaimer */}
          <VastuDisclaimer />

          {/* Stale / Analyze trigger */}
          <div className="mt-2">
            {!hasAnalysis ? (
              <div className="text-center py-3">
                <p className="text-text-muted text-xs mb-2">
                  Run analysis to see Vastu guidance for your floor plan.
                </p>
                <button
                  id="vastu-analyze-btn"
                  className="btn btn-primary btn-sm w-full"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <><RefreshCw size={12} className="animate-spin mr-1" /> Analyzing…</>
                  ) : (
                    <>🔯 Analyze Vastu</>
                  )}
                </button>
              </div>
            ) : isStale ? (
              <div className="bg-amber-950/30 border border-amber-800/40 rounded p-2 mb-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle size={11} className="text-amber-400 shrink-0" />
                  <span className="text-amber-400 text-xs font-medium">Design changed</span>
                </div>
                <p className="text-amber-300/70 text-[10px] mb-2">
                  Analysis is outdated. Re-run for updated guidance.
                </p>
                <button
                  className="btn btn-sm w-full bg-amber-700/40 hover:bg-amber-700/60 text-amber-200 border border-amber-700/50"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing…' : '↺ Analyze Again'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-1 mb-2">
                <span className="text-emerald-400 text-[10px]">✓</span>
                <span className="text-text-muted text-[10px]">Analysis current</span>
                <button
                  className="ml-auto text-[9px] text-text-muted hover:text-text-secondary transition-colors"
                  onClick={handleAnalyze}
                >
                  Re-run
                </button>
              </div>
            )}
          </div>

          {/* Analysis content */}
          {hasAnalysis && vastuAnalysis && (
            <>
              {/* Score */}
              <VastuScoreCard score={vastuAnalysis.overallScore} />

              {/* Warnings */}
              {vastuAnalysis.warnings.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {vastuAnalysis.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5 bg-amber-950/20 rounded px-2 py-1.5">
                      <AlertTriangle size={10} className="text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-amber-300/80 text-[10px] leading-tight">{w}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Category Scores */}
              <div className="mt-2">
                <button
                  className="flex items-center gap-1 w-full px-1 py-1 text-left"
                  onClick={() => toggleSection('categories')}
                >
                  {activeSection === 'categories'
                    ? <ChevronDown size={11} className="text-text-muted" />
                    : <ChevronRight size={11} className="text-text-muted" />}
                  <span className="text-text-muted text-[10px] uppercase tracking-wider font-medium">
                    Category Scores
                  </span>
                </button>
                {activeSection === 'categories' && (
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {vastuAnalysis.categoryScores.map((cs) => (
                      <VastuCategoryScore
                        key={cs.category}
                        categoryScore={cs}
                        onClick={() => handleCategoryClick(cs.category)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Rule Results */}
              <div className="mt-2">
                <button
                  className="flex items-center gap-1 w-full px-1 py-1 text-left"
                  onClick={() => toggleSection('rules')}
                >
                  {activeSection === 'rules'
                    ? <ChevronDown size={11} className="text-text-muted" />
                    : <ChevronRight size={11} className="text-text-muted" />}
                  <span className="text-text-muted text-[10px] uppercase tracking-wider font-medium">
                    Rule Details
                  </span>
                  {filterCategory && (
                    <span className="ml-auto text-[9px] text-sky-400">
                      {filterCategory}
                      <button
                        className="ml-1 hover:text-sky-300"
                        onClick={(e) => { e.stopPropagation(); setFilterCategory(null); }}
                      >✕</button>
                    </span>
                  )}
                </button>
                {activeSection === 'rules' && (
                  <VastuRuleResults
                    ruleResults={vastuAnalysis.ruleResults}
                    filterCategory={filterCategory}
                  />
                )}
              </div>

              {/* Recommendations */}
              <div className="mt-2">
                <button
                  className="flex items-center gap-1 w-full px-1 py-1 text-left"
                  onClick={() => toggleSection('recommendations')}
                >
                  {activeSection === 'recommendations'
                    ? <ChevronDown size={11} className="text-text-muted" />
                    : <ChevronRight size={11} className="text-text-muted" />}
                  <span className="text-text-muted text-[10px] uppercase tracking-wider font-medium">
                    Recommendations
                  </span>
                  {vastuAnalysis.recommendations.length > 0 && (
                    <span className="ml-auto text-[9px] text-amber-400">
                      {vastuAnalysis.recommendations.length}
                    </span>
                  )}
                </button>
                {activeSection === 'recommendations' && (
                  <VastuRecommendations recommendations={vastuAnalysis.recommendations} />
                )}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-2 border-t border-panel-border/50">
                <p className="text-text-muted text-[9px] text-center">
                  Analyzed: {new Date(vastuAnalysis.analyzedAt).toLocaleTimeString()}
                  {' · '}Rule set: {vastuSettings.ruleSetId}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
