/**
 * vastuRecommendations.ts — Human-Readable Recommendation Generation
 *
 * Generates structured VastuRecommendation objects from rule results.
 * Recommendations are grouped by severity and category for display.
 *
 * The engine NEVER recommends automatic changes. It provides guidance only.
 */

import type {
  VastuRuleResult,
  VastuRuleDefinition,
  VastuRecommendation,
  DesignEntityType,
} from '@vastuplan/shared';
import { VASTU_DIRECTION_LABELS } from '@vastuplan/shared';

/**
 * Build structured recommendations from rule results.
 *
 * Only generates recommendations for warning and violation results.
 * Preferred/acceptable/pass results are positive — no recommendation needed.
 */
export function buildRecommendations(
  ruleResults: VastuRuleResult[],
  rules: VastuRuleDefinition[]
): VastuRecommendation[] {
  const ruleMap = new Map(rules.map((r) => [r.id, r]));

  const recommendations: VastuRecommendation[] = [];

  for (const result of ruleResults) {
    // Only generate recommendations for actionable results
    if (result.status === 'preferred' || result.status === 'pass' || result.status === 'not-applicable') {
      continue;
    }
    if (result.entityId === '') continue; // skip non-applicable placeholders

    const rule = ruleMap.get(result.ruleId);
    if (!rule) continue;

    const currentZoneLabel = result.currentZone
      ? VASTU_DIRECTION_LABELS[result.currentZone] ?? result.currentZone
      : 'Unknown';

    const preferredZoneLabels = rule.preferredZones.map(
      (z) => VASTU_DIRECTION_LABELS[z] ?? z
    );

    const issue =
      result.status === 'violation'
        ? `${result.entityLabel} is in the ${currentZoneLabel} zone, which is traditionally unfavorable.`
        : `${result.entityLabel} is in the ${currentZoneLabel} zone, which is not ideal per traditional Vastu.`;

    recommendations.push({
      entityId: result.entityId,
      entityType: result.entityType as DesignEntityType,
      entityLabel: result.entityLabel,
      issue,
      currentZone: result.currentZone,
      preferredZones: rule.preferredZones,
      reason: result.explanation,
      severity: result.severity,
      ruleId: result.ruleId,
    });
  }

  // Sort: critical first, then warning, then by entity label
  return recommendations.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, positive: 2, info: 3 };
    const as = severityOrder[a.severity] ?? 9;
    const bs = severityOrder[b.severity] ?? 9;
    if (as !== bs) return as - bs;
    return a.entityLabel.localeCompare(b.entityLabel);
  });
}
