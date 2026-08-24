/**
 * vastuRules.ts — Traditional Vastu Rule Definitions (Rule Set: traditional-v1)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * IMPORTANT DISCLAIMER
 * ═══════════════════════════════════════════════════════════════════════════
 * These rules represent TRADITIONAL VASTU GUIDANCE only.
 * They are cultural and traditional in origin, not scientific.
 * They are NOT:
 *   - Building code requirements
 *   - Structural engineering requirements
 *   - Health or safety regulations
 *   - Scientifically proven correlations
 *
 * Rule Set ID: traditional-v1
 * Source Type: traditional-guidance
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Architecture:
 *   Rules are pure data — no evaluate() functions.
 *   The evaluator (vastuEvaluator.ts) applies them generically.
 *   This allows future rule sets (traditional-v2, modern-vastu, custom)
 *   without changing the engine.
 */

import type { VastuRuleDefinition } from '@vastuplan/shared';

export const RULE_SET_ID = 'traditional-v1';

/**
 * The traditional-v1 Vastu rule registry.
 *
 * Scoring weights (1–10):
 *   10 = foundational rule (entrance, kitchen fire element)
 *   7–9 = significant guidance
 *   4–6 = moderate preference
 *   1–3 = minor preference
 *
 * Add new rules here only — never scatter rule logic in components or stores.
 */
export const TRADITIONAL_V1_RULES: VastuRuleDefinition[] = [

  // ── Entrance ────────────────────────────────────────────────────────────────

  {
    id: 'entrance-preferred-direction',
    name: 'Main Entrance Direction',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'entrance',
    targetEntityTypes: ['door'],
    targetRoomTypes: [],
    preferredZones: ['N', 'NE', 'E', 'NW'],
    acceptableZones: ['SE', 'W'],
    avoidZones: ['S', 'SW'],
    severity: 'warning',
    weight: 10,
    strictnessThreshold: 'relaxed',
    explanation:
      'Traditional Vastu guidance associates the main entrance with auspicious directions. ' +
      'North and East are commonly associated with positive energy flow, sunrise, and prosperity. ' +
      'South and Southwest entrances are traditionally considered less favorable.',
    recommendation:
      'Mark your main entrance door using the Inspector, then consider its directional placement. ' +
      'North, East, or Northeast entrances are traditionally preferred. ' +
      'If a South or Southwest entrance is unavoidable, remedial measures may be considered.',
  },

  // ── Kitchen ─────────────────────────────────────────────────────────────────

  {
    id: 'kitchen-southeast-preferred',
    name: 'Kitchen in Southeast Zone',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'kitchen',
    targetEntityTypes: ['room'],
    targetRoomTypes: ['kitchen'],
    preferredZones: ['SE'],
    acceptableZones: ['NW'],
    avoidZones: ['NE', 'SW', 'CENTER'],
    severity: 'warning',
    weight: 9,
    strictnessThreshold: 'relaxed',
    explanation:
      'Traditional Vastu associates the Southeast zone with the fire element (Agni), ' +
      'making it the preferred location for cooking. The kitchen generates heat and fire, ' +
      'which is considered aligned with this zone\'s energy. ' +
      'Northwest is considered an acceptable secondary location.',
    recommendation:
      'Consider placing the kitchen in the Southeast zone of the floor plan. ' +
      'If Southeast is not available, Northwest is an acceptable alternative. ' +
      'Avoid placing the kitchen in the Northeast (spiritual/water zone) or the central Brahmasthan.',
  },

  {
    id: 'kitchen-northeast-avoid',
    name: 'Kitchen — Avoid Northeast Zone',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'kitchen',
    targetEntityTypes: ['room'],
    targetRoomTypes: ['kitchen'],
    preferredZones: [],
    acceptableZones: [],
    avoidZones: ['NE'],
    severity: 'critical',
    weight: 8,
    strictnessThreshold: 'relaxed',
    explanation:
      'Traditional Vastu considers the Northeast zone (Ishanya) as spiritually significant ' +
      'and associated with the water element. Placing cooking fire here is traditionally ' +
      'considered a clash of opposing elements.',
    recommendation:
      'Avoid placing the kitchen in the Northeast zone if possible. ' +
      'Consider relocating the kitchen to Southeast or Northwest.',
  },

  {
    id: 'kitchen-brahmasthan-avoid',
    name: 'Kitchen — Avoid Central Zone',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'kitchen',
    targetEntityTypes: ['room'],
    targetRoomTypes: ['kitchen'],
    preferredZones: [],
    acceptableZones: [],
    avoidZones: ['CENTER'],
    severity: 'warning',
    weight: 6,
    strictnessThreshold: 'balanced',
    explanation:
      'Traditional Vastu guidance suggests keeping the central zone (Brahmasthan) open ' +
      'and free from heavy activity zones. The kitchen generates heat and activity ' +
      'which is traditionally considered unsuitable for the center.',
    recommendation:
      'Move the kitchen away from the central zone toward Southeast or Northwest.',
  },

  // ── Master Bedroom ───────────────────────────────────────────────────────────

  {
    id: 'master-bedroom-southwest',
    name: 'Master Bedroom in Southwest Zone',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'master-bedroom',
    targetEntityTypes: ['room'],
    targetRoomTypes: ['master-bedroom'],
    preferredZones: ['SW'],
    acceptableZones: ['S', 'W', 'NW'],
    avoidZones: ['NE', 'SE', 'CENTER'],
    severity: 'warning',
    weight: 9,
    strictnessThreshold: 'relaxed',
    explanation:
      'Traditional Vastu associates the Southwest zone (Nairitya) with stability, ' +
      'strength, and security — qualities considered ideal for the master bedroom. ' +
      'This placement is also associated with the earth element, suggesting grounded rest.',
    recommendation:
      'Consider placing the master bedroom in the Southwest zone for stability. ' +
      'South and West are acceptable alternatives. ' +
      'The Northeast and center are traditionally discouraged for heavy bedroom use.',
  },

  {
    id: 'master-bedroom-northeast-avoid',
    name: 'Master Bedroom — Avoid Northeast',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'master-bedroom',
    targetEntityTypes: ['room'],
    targetRoomTypes: ['master-bedroom'],
    preferredZones: [],
    acceptableZones: [],
    avoidZones: ['NE'],
    severity: 'warning',
    weight: 7,
    strictnessThreshold: 'balanced',
    explanation:
      'Traditional Vastu reserves the Northeast zone for spiritual purposes and ' +
      'considers it less suitable for heavy sleeping rooms.',
    recommendation:
      'Avoid placing the master bedroom in the Northeast. Consider Southwest for better alignment.',
  },

  // ── Bedrooms (other) ─────────────────────────────────────────────────────────

  {
    id: 'bedroom-south-west-preferred',
    name: 'Bedroom in South or West Zone',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'bedrooms',
    targetEntityTypes: ['room'],
    targetRoomTypes: ['bedroom', 'guest-bedroom', 'kids-bedroom', 'bedroom-2', 'bedroom-3'],
    preferredZones: ['S', 'W', 'SW', 'NW'],
    acceptableZones: ['SE', 'N'],
    avoidZones: ['NE', 'CENTER'],
    severity: 'info',
    weight: 6,
    strictnessThreshold: 'balanced',
    explanation:
      'Traditional Vastu guidance suggests South and West zones for sleeping rooms, ' +
      'associating these directions with rest, discipline, and stability.',
    recommendation:
      'Consider placing bedrooms in the South, West, or Southwest zones. ' +
      'Northwest is also acceptable for secondary bedrooms.',
  },

  {
    id: 'bedroom-northeast-avoid',
    name: 'Bedroom — Avoid Northeast',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'bedrooms',
    targetEntityTypes: ['room'],
    targetRoomTypes: ['bedroom', 'guest-bedroom', 'kids-bedroom', 'bedroom-2', 'bedroom-3'],
    preferredZones: [],
    acceptableZones: [],
    avoidZones: ['NE'],
    severity: 'warning',
    weight: 5,
    strictnessThreshold: 'balanced',
    explanation:
      'Traditional Vastu reserves the Northeast for spiritual and contemplative uses.',
    recommendation:
      'Consider moving the bedroom away from the Northeast zone.',
  },

  // ── Pooja Room ───────────────────────────────────────────────────────────────

  {
    id: 'pooja-northeast-preferred',
    name: 'Pooja / Prayer Room in Northeast',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'pooja-room',
    targetEntityTypes: ['room'],
    targetRoomTypes: ['pooja-room', 'prayer-room', 'mandir', 'temple', 'spiritual'],
    preferredZones: ['NE'],
    acceptableZones: ['E', 'N'],
    avoidZones: ['S', 'SW', 'SE', 'CENTER'],
    severity: 'warning',
    weight: 8,
    strictnessThreshold: 'relaxed',
    explanation:
      'Traditional Vastu strongly associates the Northeast zone (Ishanya) with spiritual ' +
      'energy, water element, and divine blessings — making it the most favored location ' +
      'for a prayer or meditation room. East and North are acceptable alternatives.',
    recommendation:
      'Place the pooja room or prayer area in the Northeast zone for best traditional alignment. ' +
      'East or North are acceptable secondary locations. ' +
      'Avoid South and Southwest for sacred spaces.',
  },

  // ── Bathroom / Toilet ────────────────────────────────────────────────────────

  {
    id: 'toilet-northwest-southeast-acceptable',
    name: 'Bathroom / Toilet in Northwest or Southeast',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'bathroom-toilet',
    targetEntityTypes: ['room'],
    targetRoomTypes: ['bathroom', 'toilet', 'attached-bathroom', 'wc', 'powder-room'],
    preferredZones: ['NW', 'SE'],
    acceptableZones: ['S', 'W'],
    avoidZones: ['NE', 'SW', 'CENTER'],
    severity: 'warning',
    weight: 7,
    strictnessThreshold: 'relaxed',
    explanation:
      'Traditional Vastu guidance associates Northwest and Southeast as acceptable zones ' +
      'for sanitary spaces. Northeast is strongly discouraged as it is considered sacred. ' +
      'Southwest is associated with stability and considered unsuitable for waste spaces.',
    recommendation:
      'Place bathrooms and toilets in the Northwest or Southeast zones where possible. ' +
      'Strictly avoid the Northeast zone for sanitary facilities.',
  },

  {
    id: 'toilet-northeast-critical',
    name: 'Toilet — Strongly Avoid Northeast',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'bathroom-toilet',
    targetEntityTypes: ['room'],
    targetRoomTypes: ['bathroom', 'toilet', 'attached-bathroom', 'wc'],
    preferredZones: [],
    acceptableZones: [],
    avoidZones: ['NE'],
    severity: 'critical',
    weight: 9,
    strictnessThreshold: 'relaxed',
    explanation:
      'Traditional Vastu strongly discourages placing sanitary facilities in the Northeast zone, ' +
      'which is considered the most sacred direction. This is one of the most consistently ' +
      'emphasized guidelines in traditional Vastu texts.',
    recommendation:
      'Relocate the toilet/bathroom from the Northeast zone. This is a high-priority consideration.',
  },

  {
    id: 'toilet-southwest-warning',
    name: 'Toilet — Avoid Southwest',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'bathroom-toilet',
    targetEntityTypes: ['room'],
    targetRoomTypes: ['bathroom', 'toilet', 'attached-bathroom', 'wc'],
    preferredZones: [],
    acceptableZones: [],
    avoidZones: ['SW'],
    severity: 'warning',
    weight: 5,
    strictnessThreshold: 'balanced',
    explanation:
      'Traditional Vastu associates Southwest with the master of the household and stability. ' +
      'Sanitary facilities here are traditionally considered unfavorable.',
    recommendation:
      'Consider moving the bathroom from the Southwest zone to Northwest or Southeast.',
  },

  // ── Staircase ────────────────────────────────────────────────────────────────

  {
    id: 'staircase-south-west-preferred',
    name: 'Staircase in South or West Zone',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'staircase',
    targetEntityTypes: ['staircase'],
    targetRoomTypes: [],
    preferredZones: ['S', 'SW', 'W'],
    acceptableZones: ['SE', 'NW'],
    avoidZones: ['NE', 'CENTER'],
    severity: 'warning',
    weight: 7,
    strictnessThreshold: 'relaxed',
    explanation:
      'Traditional Vastu guidance places staircases in the South, Southwest, or West zones. ' +
      'Staircases are heavy structural elements and are traditionally associated with ' +
      'the earth element zones. Northeast staircases are strongly discouraged.',
    recommendation:
      'Position the staircase in the South, Southwest, or West zone. ' +
      'Avoid Northeast and center placements.',
  },

  {
    id: 'staircase-northeast-avoid',
    name: 'Staircase — Avoid Northeast',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'staircase',
    targetEntityTypes: ['staircase'],
    targetRoomTypes: [],
    preferredZones: [],
    acceptableZones: [],
    avoidZones: ['NE'],
    severity: 'critical',
    weight: 8,
    strictnessThreshold: 'relaxed',
    explanation:
      'Traditional Vastu considers a staircase in the Northeast a significant concern, ' +
      'as it is believed to create structural weight in the spiritual energy zone.',
    recommendation:
      'Relocate the staircase from the Northeast zone to South or West.',
  },

  {
    id: 'staircase-center-avoid',
    name: 'Staircase — Avoid Central Zone',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'staircase',
    targetEntityTypes: ['staircase'],
    targetRoomTypes: [],
    preferredZones: [],
    acceptableZones: [],
    avoidZones: ['CENTER'],
    severity: 'warning',
    weight: 7,
    strictnessThreshold: 'balanced',
    explanation:
      'Traditional Vastu guidance emphasizes keeping the central Brahmasthan open and free ' +
      'from heavy structures including staircases.',
    recommendation:
      'Move the staircase away from the central zone.',
  },

  // ── Living Room ──────────────────────────────────────────────────────────────

  {
    id: 'living-north-east-preferred',
    name: 'Living Room in North or East Zone',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'living-area',
    targetEntityTypes: ['room'],
    targetRoomTypes: ['living-room', 'hall', 'drawing-room', 'lounge', 'sitting-room'],
    preferredZones: ['N', 'E', 'NE', 'NW'],
    acceptableZones: ['W', 'SE'],
    avoidZones: ['SW', 'CENTER'],
    severity: 'info',
    weight: 5,
    strictnessThreshold: 'balanced',
    explanation:
      'Traditional Vastu associates North and East with wealth and sunrise energy, ' +
      'making them preferred locations for the living/receiving area.',
    recommendation:
      'Place the living room toward the North, East, or Northeast for positive energy flow.',
  },

  // ── Parking ──────────────────────────────────────────────────────────────────

  {
    id: 'parking-southeast-northwest',
    name: 'Parking in Southeast or Northwest',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'parking',
    targetEntityTypes: ['parking'],
    targetRoomTypes: [],
    preferredZones: ['SE', 'NW'],
    acceptableZones: ['S', 'W'],
    avoidZones: ['NE', 'SW', 'CENTER'],
    severity: 'info',
    weight: 4,
    strictnessThreshold: 'balanced',
    explanation:
      'Traditional Vastu guidance generally suggests Southeast or Northwest for ' +
      'parking areas, keeping fire/vehicle energy aligned with appropriate zones.',
    recommendation:
      'Consider placing parking areas in the Southeast or Northwest zones.',
  },

  // ── Garden / Open Space ──────────────────────────────────────────────────────

  {
    id: 'garden-north-northeast-preferred',
    name: 'Garden / Open Space in North or Northeast',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'garden',
    targetEntityTypes: ['garden'],
    targetRoomTypes: [],
    preferredZones: ['N', 'NE', 'E'],
    acceptableZones: ['NW', 'SE'],
    avoidZones: ['SW', 'CENTER'],
    severity: 'info',
    weight: 4,
    strictnessThreshold: 'strict',
    explanation:
      'Traditional Vastu suggests open spaces and gardens in the North and Northeast ' +
      'to allow positive energy and morning sunlight to flow into the home.',
    recommendation:
      'Place garden, lawn, or open spaces in the North, Northeast, or East zones.',
  },

  // ── Brahmasthan (Center) ──────────────────────────────────────────────────────

  {
    id: 'brahmasthan-keep-open',
    name: 'Brahmasthan (Center) — Keep Open',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'brahmasthan',
    targetEntityTypes: ['room', 'column', 'staircase'],
    targetRoomTypes: [],
    preferredZones: [],
    acceptableZones: [],
    avoidZones: ['CENTER'],
    severity: 'critical',
    weight: 10,
    strictnessThreshold: 'relaxed',
    explanation:
      'The central zone of a floor plan, called Brahmasthan, is considered the most sacred ' +
      'in traditional Vastu. It is associated with cosmic energy and is traditionally kept ' +
      'open, unobstructed, and free from heavy structures, rooms, or columns.',
    recommendation:
      'Keep the central zone free from rooms, heavy columns, or staircases. ' +
      'An open courtyard, light well, or passage in the center is traditionally considered ideal.',
  },

  // ── Dining Room ───────────────────────────────────────────────────────────────

  {
    id: 'dining-west-preferred',
    name: 'Dining Room in West Zone',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'general',
    targetEntityTypes: ['room'],
    targetRoomTypes: ['dining-room', 'dining'],
    preferredZones: ['W'],
    acceptableZones: ['E', 'N'],
    avoidZones: ['SE', 'NE'],
    severity: 'info',
    weight: 3,
    strictnessThreshold: 'strict',
    explanation:
      'Traditional Vastu associates West with gains and prosperity, suggesting it ' +
      'as a good location for dining rooms.',
    recommendation:
      'Consider placing the dining room in the West or East zone.',
  },

  // ── Study / Office ────────────────────────────────────────────────────────────

  {
    id: 'study-north-east-preferred',
    name: 'Study / Office in North or East',
    ruleSetId: RULE_SET_ID,
    sourceType: 'traditional-guidance',
    category: 'general',
    targetEntityTypes: ['room'],
    targetRoomTypes: ['study-room', 'office', 'work-room', 'library'],
    preferredZones: ['N', 'E', 'NE'],
    acceptableZones: ['W', 'NW'],
    avoidZones: ['S', 'SW'],
    severity: 'info',
    weight: 4,
    strictnessThreshold: 'strict',
    explanation:
      'Traditional Vastu associates North with wealth/Mercury (career, business) and ' +
      'East with knowledge and wisdom, making these zones preferred for study and work.',
    recommendation:
      'Place study rooms or home offices in the North, East, or Northeast zone.',
  },
];

/**
 * Get rules applicable to a specific rule set.
 * Enables future support for multiple rule sets without changing the evaluator.
 */
export function getRulesForSet(ruleSetId: string): VastuRuleDefinition[] {
  return TRADITIONAL_V1_RULES.filter((r) => r.ruleSetId === ruleSetId);
}

/**
 * Get rules for a specific strictness level.
 * Relaxed = all rules; Balanced = balanced+strict; Strict = strict only.
 *
 * Counterintuitively: strictnessThreshold indicates the MINIMUM strictness
 * setting at which the rule is INCLUDED in analysis.
 * 'relaxed' rules appear in all modes.
 * 'balanced' rules appear in balanced and strict modes.
 * 'strict' rules appear only in strict mode.
 */
export function filterRulesByStrictness(
  rules: VastuRuleDefinition[],
  strictness: import('@vastuplan/shared').VastuStrictness
): VastuRuleDefinition[] {
  const order = { relaxed: 0, balanced: 1, strict: 2 };
  const settingLevel = order[strictness];
  return rules.filter((r) => order[r.strictnessThreshold] <= settingLevel);
}
