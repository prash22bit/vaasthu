/**
 * vastuEngine.ts — Vastu Analysis Entry Point
 *
 * analyzeVastu(project, floorIndex?, settings?) is the single public function.
 *
 * Pipeline:
 *   Project (read-only)
 *       ↓
 *   getFloor()
 *       ↓
 *   buildVastuZoneMap()     ← geometry, not Konva
 *       ↓
 *   evaluateRules()         ← data-driven, no if/else per rule
 *       ↓
 *   calculateCategoryScores()
 *       ↓
 *   calculateOverallScore()
 *       ↓
 *   buildRecommendations()
 *       ↓
 *   VastuAnalysis (immutable snapshot)
 *
 * GUARANTEES:
 *   - Never calls addEntity / updateEntity / deleteEntities
 *   - Never writes to projectStore
 *   - Never writes to MongoDB
 *   - Safe to call from unit tests without React or Konva
 */

import type { Project, VastuAnalysis, VastuSettings } from '@vastuplan/shared';
import { DEFAULT_VASTU_SETTINGS } from '@vastuplan/shared';
import { buildVastuZoneMap } from './vastuZones';
import { TRADITIONAL_V1_RULES, getRulesForSet } from './vastuRules';
import { evaluateRules } from './vastuEvaluator';
import { calculateCategoryScores, calculateOverallScore, generateWarnings } from './vastuScoring';
import { buildRecommendations } from './vastuRecommendations';
import { getFloor, computeDesignHash } from './vastuUtils';
import { DEFAULT_ZONE_CONFIG } from './vastuGeometry';

// ── Main Analysis Function ────────────────────────────────────────────────────

/**
 * Analyze a project for traditional Vastu guidance.
 *
 * @param project - The project to analyze (never mutated)
 * @param floorIndex - Which floor to analyze (default: 0 = Ground Floor)
 * @param settings - Vastu analysis settings (default: traditional-v1, balanced)
 * @returns VastuAnalysis snapshot (immutable, separate from the CAD design)
 *
 * @example
 * // In a Vitest unit test (no React, no Konva required):
 * const analysis = analyzeVastu(project);
 * expect(analysis.overallScore).toBeGreaterThan(0);
 */
export function analyzeVastu(
  project: Project,
  floorIndex = 0,
  settings: VastuSettings = DEFAULT_VASTU_SETTINGS
): VastuAnalysis {
  const floor = getFloor(project, floorIndex);
  const entities = floor?.entities ?? [];

  // 1. Build zone map from plot geometry
  const zoneMap = buildVastuZoneMap(project.plot, DEFAULT_ZONE_CONFIG);

  // 2. Get applicable rules for the configured rule set
  const rules = getRulesForSet(settings.ruleSetId);
  const allRules = rules.length > 0 ? rules : TRADITIONAL_V1_RULES;

  // 3. Evaluate rules against entities (pure, no side effects)
  const ruleResults = evaluateRules(entities, zoneMap, project.plot, allRules, settings);

  // 4. Calculate category and overall scores (transparent, traceable)
  const categoryScores = calculateCategoryScores(ruleResults, allRules, settings);
  const overallScore = calculateOverallScore(categoryScores);

  // 5. Build human-readable recommendations (warnings and violations only)
  const recommendations = buildRecommendations(ruleResults, allRules);

  // 6. Generate analysis-level warnings
  const warnings = generateWarnings(ruleResults, entities);

  // 7. Compute design hash for stale detection
  const designHash = computeDesignHash(project, floorIndex);

  return {
    projectId: project.id,
    floorIndex,
    ruleSetId: settings.ruleSetId,
    designHash,
    overallScore,
    categoryScores,
    zoneMap,
    ruleResults,
    warnings,
    recommendations,
    analyzedAt: new Date().toISOString(),
    settings,
  };
}

// Re-export utilities used by the store and UI
export { TRADITIONAL_V1_RULES, DEFAULT_ZONE_CONFIG };
export type { VastuZoneConfig } from './vastuGeometry';
