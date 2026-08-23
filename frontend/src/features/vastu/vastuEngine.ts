// =============================================================================
// VastuPlan — Vastu Engine (Phase 3 Architecture Stub)
//
// This module defines the architecture for the Vastu analysis engine.
// The actual rules and analysis logic will be implemented in Phase 3.
//
// Architecture principles:
//   - Rules are data-driven, not scattered if/else statements
//   - Each rule is independently configurable
//   - The engine is invoked explicitly, never from UI components
// =============================================================================

import type { Project, VastuRule, VastuAnalysis, VastuViolation, VastuZone, VastuZoneType } from '@vastuplan/shared';

// ---------------------------------------------------------------------------
// Rule registry (to be populated in Phase 3)
// ---------------------------------------------------------------------------

const VASTU_RULES: VastuRule[] = [
  // Phase 3 will add rules such as:
  // { id: 'kitchen-south-east', name: 'Kitchen in South-East', ... }
  // { id: 'pooja-north-east', name: 'Prayer room in North-East', ... }
  // { id: 'bedroom-south-west', name: 'Master bedroom in South-West', ... }
];

// ---------------------------------------------------------------------------
// Zone calculation (stub)
// ---------------------------------------------------------------------------

const ZONE_TYPES: VastuZoneType[] = [
  'north', 'north-east', 'east', 'south-east',
  'south', 'south-west', 'west', 'north-west', 'center',
];

/**
 * Divide a plot into Vastu zones.
 * Will be fully implemented in Phase 3.
 */
export function calculateVastuZones(_project: Project): VastuZone[] {
  // TODO (Phase 3): Divide the plot into 9 zones based on plot dimensions and facing
  return [];
}

// ---------------------------------------------------------------------------
// Analysis entry point
// ---------------------------------------------------------------------------

/**
 * Analyze a project for Vastu compliance.
 * Returns an empty/neutral analysis in Phase 1.
 * Will be fully implemented in Phase 3.
 */
export function analyzeVastu(project: Project): VastuAnalysis {
  const zones = calculateVastuZones(project);
  const violations: VastuViolation[] = [];

  // Run each registered rule
  for (const rule of VASTU_RULES) {
    if (rule.evaluate) {
      const violation = rule.evaluate(project);
      if (violation) violations.push(violation);
    }
  }

  const score = calculateScore(violations);

  return {
    projectId: project.id,
    score,
    zones,
    violations,
    recommendations: generateRecommendations(violations),
    analyzedAt: new Date().toISOString(),
  };
}

function calculateScore(violations: VastuViolation[]): number {
  if (violations.length === 0) return 100;
  const deductions = violations.reduce((acc, v) => {
    const penalty = { good: 0, neutral: 0, warning: 10, critical: 25 }[v.severity] ?? 0;
    return acc + penalty;
  }, 0);
  return Math.max(0, 100 - deductions);
}

function generateRecommendations(violations: VastuViolation[]): string[] {
  return violations.map((v) => v.suggestion).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Rule registration (for Phase 3)
// ---------------------------------------------------------------------------

/**
 * Register a Vastu rule with the engine.
 * Phase 3 will call this to register all rules.
 */
export function registerVastuRule(rule: VastuRule): void {
  const existing = VASTU_RULES.findIndex((r) => r.id === rule.id);
  if (existing !== -1) {
    VASTU_RULES[existing] = rule;
  } else {
    VASTU_RULES.push(rule);
  }
}

export { ZONE_TYPES };
