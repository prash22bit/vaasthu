/**
 * vastuEvaluator.ts — Generic Rule Evaluator
 *
 * Applies VastuRuleDefinition[] to DesignEntity[] generically.
 * There is NO per-rule if/else logic here.
 * Adding new rules only requires adding to vastuRules.ts.
 */

import type {
  DesignEntity,
  RoomEntity,
  DoorEntity,
  Plot,
  VastuDirection,
  VastuZoneMap,
  VastuRuleDefinition,
  VastuRuleResult,
  VastuRuleStatus,
  VastuRuleSeverity,
  VastuSettings,
} from '@vastuplan/shared';
import { classifyEntityZone, getEntityLabel } from './vastuGeometry';
import type { VastuZoneConfig } from './vastuGeometry';
import { DEFAULT_ZONE_CONFIG } from './vastuGeometry';
import { filterRulesByStrictness } from './vastuRules';
import { getMainEntrance, getRoomsByType } from './vastuUtils';

// ── Score impact constants ────────────────────────────────────────────────────

const SCORE_MULTIPLIER: Record<VastuRuleStatus, number> = {
  preferred:      1.0,   // full weight bonus
  pass:           0.5,   // partial bonus
  acceptable:     0.0,   // neutral (no impact)
  'not-applicable': 0.0, // neutral
  warning:       -0.5,   // half-weight deduction
  violation:     -1.0,   // full-weight deduction
};

const STRICTNESS_MULTIPLIER: Record<string, number> = {
  relaxed:  0.8,
  balanced: 1.0,
  strict:   1.3,
};

// ── Applicability Check ───────────────────────────────────────────────────────

/**
 * Determine if a rule applies to a given entity.
 * Rules target entity types and/or room types.
 */
function ruleAppliesToEntity(
  rule: VastuRuleDefinition,
  entity: DesignEntity
): boolean {
  // Check entity type match
  const typeMatch =
    !rule.targetEntityTypes ||
    rule.targetEntityTypes.length === 0 ||
    rule.targetEntityTypes.includes(entity.type);

  if (!typeMatch) return false;

  // If rule targets specific room types, only match room entities
  if (rule.targetRoomTypes && rule.targetRoomTypes.length > 0) {
    if (entity.type !== 'room') return false;
    const room = entity as RoomEntity;
    const roomType = room.properties.roomType ?? '';
    return rule.targetRoomTypes.includes(roomType);
  }

  // For entrance rule: only applies to door with doorRole = 'main-entrance'
  if (rule.category === 'entrance' && entity.type === 'door') {
    const door = entity as DoorEntity;
    return door.properties.doorRole === 'main-entrance';
  }

  return true;
}

// ── Zone Status Classification ────────────────────────────────────────────────

/**
 * Classify the rule result status based on where the entity is vs where it should be.
 */
function classifyZoneStatus(
  zone: VastuDirection,
  rule: VastuRuleDefinition
): VastuRuleStatus {
  if (rule.preferredZones.includes(zone)) return 'preferred';
  if (rule.acceptableZones.includes(zone)) return 'acceptable';
  if (rule.avoidZones.includes(zone)) return 'violation';
  // Not in any listed zone → neutral pass
  return 'pass';
}

/**
 * Compute the effective severity for a result.
 * Violations use the rule's declared severity; preferred/acceptable use 'positive'/'info'.
 */
function effectiveSeverity(
  status: VastuRuleStatus,
  rule: VastuRuleDefinition
): VastuRuleSeverity {
  if (status === 'preferred' || status === 'pass') return 'positive';
  if (status === 'acceptable' || status === 'not-applicable') return 'info';
  if (status === 'warning') return 'warning';
  if (status === 'violation') return rule.severity;
  return 'info';
}

// ── Message Builder ───────────────────────────────────────────────────────────

function buildMessage(
  entity: DesignEntity,
  zone: VastuDirection | null,
  rule: VastuRuleDefinition,
  status: VastuRuleStatus
): string {
  const label = getEntityLabel(entity);
  const dirLabel = zone ?? 'Unknown';

  switch (status) {
    case 'preferred':
      return `${label} is in the ${dirLabel} zone — preferred per traditional Vastu guidance.`;
    case 'pass':
      return `${label} is in the ${dirLabel} zone — acceptable per traditional Vastu guidance.`;
    case 'acceptable':
      return `${label} is in the ${dirLabel} zone — an acceptable alternative location.`;
    case 'warning':
      return `${label} is in the ${dirLabel} zone — traditional Vastu guidance prefers a different location.`;
    case 'violation':
      return `${label} is in the ${dirLabel} zone — traditional Vastu guidance advises against this placement.`;
    case 'not-applicable':
      return `${rule.name}: Not applicable (no matching entity found).`;
    default:
      return `${label} is in the ${dirLabel} zone.`;
  }
}

// ── Score Impact Calculation ──────────────────────────────────────────────────

function calculateScoreImpact(
  status: VastuRuleStatus,
  rule: VastuRuleDefinition,
  strictness: string
): number {
  const multiplier = SCORE_MULTIPLIER[status] ?? 0;
  const strictMult = STRICTNESS_MULTIPLIER[strictness] ?? 1.0;
  // scoreImpact range: -13 (critical, strict) to +10 (preferred)
  return Math.round(rule.weight * multiplier * strictMult * 10) / 10;
}

// ── Main Evaluator ────────────────────────────────────────────────────────────

/**
 * Evaluate all rules against all entities.
 *
 * Algorithm:
 *   for each rule:
 *     find matching entities
 *     if none found: emit 'not-applicable' result
 *     for each matching entity:
 *       classify its zone
 *       determine status (preferred / acceptable / warning / violation)
 *       compute score impact
 *       build result
 *
 * This function is pure: no side effects, no mutations.
 */
export function evaluateRules(
  entities: DesignEntity[],
  _zoneMap: VastuZoneMap,
  plot: Plot,
  rules: VastuRuleDefinition[],
  settings: VastuSettings,
  config: VastuZoneConfig = DEFAULT_ZONE_CONFIG
): VastuRuleResult[] {
  const results: VastuRuleResult[] = [];
  const applicableRules = filterRulesByStrictness(rules, settings.strictness);

  for (const rule of applicableRules) {
    // Find entities this rule applies to
    const matchingEntities = entities.filter(
      (e) => e.visible && ruleAppliesToEntity(rule, e)
    );

    if (matchingEntities.length === 0) {
      // Emit a single 'not-applicable' result for the rule
      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleCategory: rule.category,
        entityId: '',
        entityType: rule.targetEntityTypes?.[0] ?? 'room',
        entityLabel: rule.name,
        status: 'not-applicable',
        severity: 'info',
        scoreImpact: 0,
        currentZone: null,
        message: `${rule.name}: No relevant entity found in the design.`,
        explanation: rule.explanation,
        recommendation: rule.recommendation,
      });
      continue;
    }

    for (const entity of matchingEntities) {
      const zone = classifyEntityZone(entity, plot, config);
      const status = classifyZoneStatus(zone, rule);
      const severity = effectiveSeverity(status, rule);
      const scoreImpact = calculateScoreImpact(status, rule, settings.strictness);
      const message = buildMessage(entity, zone, rule, status);

      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleCategory: rule.category,
        entityId: entity.id,
        entityType: entity.type,
        entityLabel: getEntityLabel(entity),
        status,
        severity,
        scoreImpact,
        currentZone: zone,
        message,
        explanation: rule.explanation,
        recommendation: rule.recommendation,
      });
    }
  }

  return results;
}

export { getMainEntrance, getRoomsByType };
