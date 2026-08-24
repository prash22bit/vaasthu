/**
 * vastuScoring.ts — Vastu Score Calculation
 *
 * Every score change is traceable to a specific rule result.
 * The score is NOT presented as scientific — it is a "Vastu Guidance Score".
 */

import type {
  VastuRuleResult,
  VastuRuleDefinition,
  VastuRuleCategory,
  VastuCategoryScore,
  VastuRuleStatus,
  VastuSettings,
} from '@vastuplan/shared';
import { CATEGORY_LABELS, worstStatus } from './vastuUtils';

// ── Category Weights ──────────────────────────────────────────────────────────

/**
 * Maximum achievable score per category (sums to 100 overall).
 * These weights reflect relative importance in traditional Vastu.
 * Configurable for future rule sets.
 */
const CATEGORY_MAX_SCORES: Partial<Record<VastuRuleCategory, number>> = {
  entrance:          15,
  kitchen:           14,
  'master-bedroom':  13,
  bedrooms:          10,
  'pooja-room':      10,
  'bathroom-toilet': 12,
  staircase:          9,
  'living-area':      7,
  brahmasthan:       10,
  parking:            5,
  garden:             5,
  general:           10,
};

function getCategoryMax(category: VastuRuleCategory): number {
  return CATEGORY_MAX_SCORES[category] ?? 5;
}

// ── Category Score Calculation ────────────────────────────────────────────────

/**
 * Calculate per-category scores from rule results.
 *
 * For each category:
 *   - Collect all rule results (excluding not-applicable)
 *   - Sum positive/negative score impacts
 *   - Normalize to 0–100 against the category max
 *
 * Each contributing result is in the returned data for transparency.
 */
export function calculateCategoryScores(
  ruleResults: VastuRuleResult[],
  _rules: VastuRuleDefinition[],
  _settings: VastuSettings
): VastuCategoryScore[] {
  // Group results by category
  const byCategory = new Map<VastuRuleCategory, VastuRuleResult[]>();

  for (const result of ruleResults) {
    const cat = result.ruleCategory;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(result);
  }

  const categoryScores: VastuCategoryScore[] = [];

  for (const [category, results] of byCategory.entries()) {
    const applicable = results.filter((r) => r.status !== 'not-applicable');
    const maxScore = getCategoryMax(category);

    if (applicable.length === 0) {
      // All not-applicable → neutral 50 for this category
      categoryScores.push({
        category,
        label: CATEGORY_LABELS[category] ?? category,
        score: 50,
        maxScore: 100,
        ruleCount: results.length,
        status: 'not-applicable',
      });
      continue;
    }

    // Normalized score: start at 50 (neutral), apply impacts
    // Preferred results push toward 100; violations push toward 0
    const totalImpact = applicable.reduce((sum, r) => sum + r.scoreImpact, 0);
    const weightedMax = maxScore; // max possible impact = sum of weights
    const normalized = 50 + (totalImpact / weightedMax) * 50;
    const score = Math.max(0, Math.min(100, Math.round(normalized)));

    const statuses = applicable.map((r) => r.status) as VastuRuleStatus[];
    const worst = worstStatus(statuses);

    categoryScores.push({
      category,
      label: CATEGORY_LABELS[category] ?? category,
      score,
      maxScore: 100,
      ruleCount: applicable.length,
      status: worst,
    });
  }

  // Sort by category importance (worst first for salience)
  return categoryScores.sort((a, b) => a.score - b.score);
}

// ── Overall Score ─────────────────────────────────────────────────────────────

/**
 * Calculate the overall Vastu Guidance Score (0–100) from category scores.
 *
 * Uses a weighted average of category scores, where the weights are the
 * category max scores (summing to 100).
 *
 * The result is labeled "Vastu Guidance Score" — NOT "Scientific Score",
 * "Health Score", or "Success Probability".
 */
export function calculateOverallScore(categoryScores: VastuCategoryScore[]): number {
  if (categoryScores.length === 0) return 50; // neutral

  const applicable = categoryScores.filter((c) => c.status !== 'not-applicable');
  if (applicable.length === 0) return 50;

  // Weighted average by category max score
  let weightedSum = 0;
  let totalWeight = 0;

  for (const cs of applicable) {
    const weight = getCategoryMax(cs.category);
    weightedSum += cs.score * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;
}

// ── Warnings ──────────────────────────────────────────────────────────────────

/**
 * Generate analysis-level warnings from rule results.
 * Warnings are distinct from per-entity rule results.
 */
export function generateWarnings(
  ruleResults: VastuRuleResult[],
  entities: import('@vastuplan/shared').DesignEntity[]
): string[] {
  const warnings: string[] = [];

  // Check: no main entrance marked
  const hasMainEntrance = entities.some(
    (e) =>
      e.type === 'door' &&
      (e as import('@vastuplan/shared').DoorEntity).properties.doorRole === 'main-entrance'
  );
  if (!hasMainEntrance) {
    warnings.push(
      'No main entrance door has been marked. ' +
      'Select a door and set its role to "Main Entrance" in the Inspector for accurate entrance analysis.'
    );
  }

  // Check: critical violations
  const criticals = ruleResults.filter(
    (r) => r.severity === 'critical' && r.status === 'violation'
  );
  if (criticals.length > 0) {
    warnings.push(
      `${criticals.length} critical traditional Vastu concern${criticals.length > 1 ? 's' : ''} detected. ` +
      'Review the rule results below for details.'
    );
  }

  return warnings;
}
