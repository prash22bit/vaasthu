/**
 * vastuUtils.ts — Utility Functions for the Vastu Engine
 */

import type {
  DesignEntity,
  DoorEntity,
  RoomEntity,
  Project,
  Floor,
  VastuRuleSeverity,
  VastuRuleStatus,
} from '@vastuplan/shared';

// ── Entity Accessors ──────────────────────────────────────────────────────────

/**
 * Find the main entrance door on a floor.
 * Returns null if no door is marked as main-entrance.
 *
 * Note: The UI enforces single main-entrance per floor.
 * This function returns the first found (there should be only one).
 */
export function getMainEntrance(entities: DesignEntity[]): DoorEntity | null {
  return (
    (entities.find(
      (e) => e.type === 'door' && (e as DoorEntity).properties.doorRole === 'main-entrance'
    ) as DoorEntity | undefined) ?? null
  );
}

/**
 * Get all room entities matching one or more room types.
 */
export function getRoomsByType(
  entities: DesignEntity[],
  ...roomTypes: string[]
): RoomEntity[] {
  return entities.filter(
    (e) =>
      e.type === 'room' &&
      roomTypes.includes((e as RoomEntity).properties.roomType ?? '')
  ) as RoomEntity[];
}

/**
 * Get a floor from a project safely, with a fallback to floorIndex=0.
 */
export function getFloor(project: Project, floorIndex: number): Floor | null {
  return project.floors[floorIndex] ?? project.floors[0] ?? null;
}

// ── Design Hash ───────────────────────────────────────────────────────────────

/**
 * Compute a lightweight hash of the design state at a given floor.
 *
 * Used to detect when analysis is stale (design changed since last run).
 * NOT a cryptographic hash — suitable only for change detection.
 *
 * The hash covers:
 *   - Plot dimensions and facing
 *   - All entity IDs, types, positions, dimensions, and properties
 *
 * This function is deterministic for the same design state.
 * It does NOT depend on timestamps or auto-generated IDs beyond entity IDs.
 */
export function computeDesignHash(project: Project, floorIndex: number): string {
  const floor = getFloor(project, floorIndex);
  const snapshot = {
    plotWidth: project.plot.width,
    plotLength: project.plot.length,
    plotFacing: project.plot.facing,
    plotUnit: project.plot.unit,
    entities: (floor?.entities ?? []).map((e) => ({
      id: e.id,
      type: e.type,
      px: Math.round(e.position.x * 1000),
      py: Math.round(e.position.y * 1000),
      dw: Math.round(e.dimensions.width * 1000),
      dh: Math.round(e.dimensions.height * 1000),
      props: e.properties,
    })),
  };
  return JSON.stringify(snapshot);
}

// ── Formatting ────────────────────────────────────────────────────────────────

/** Convert an overall Vastu score (0–100) to a human-readable label */
export function formatScoreLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Moderate';
  if (score >= 40) return 'Needs Attention';
  return 'Significant Concerns';
}

/** Convert a severity to an icon character */
export function severityIcon(severity: VastuRuleSeverity): string {
  const icons: Record<VastuRuleSeverity, string> = {
    positive: '✓',
    info:     '○',
    warning:  '⚠',
    critical: '✕',
  };
  return icons[severity] ?? '○';
}

/** Convert a status to a Tailwind CSS color class */
export function statusColorClass(status: VastuRuleStatus): string {
  switch (status) {
    case 'preferred': return 'text-emerald-400';
    case 'pass':      return 'text-emerald-300';
    case 'acceptable': return 'text-sky-400';
    case 'not-applicable': return 'text-text-muted';
    case 'warning':   return 'text-amber-400';
    case 'violation': return 'text-rose-400';
    default:          return 'text-text-secondary';
  }
}

/** Get a CSS/Tailwind background color for a zone in the heatmap */
export function zoneHeatmapColor(direction: string): string {
  const colors: Record<string, string> = {
    NE:     'rgba(34,211,238,0.18)',   // cyan
    N:      'rgba(52,211,153,0.18)',   // emerald
    NW:     'rgba(148,163,184,0.18)',  // slate
    W:      'rgba(96,165,250,0.18)',   // blue
    SW:     'rgba(251,191,36,0.18)',   // amber
    S:      'rgba(251,146,60,0.18)',   // orange
    SE:     'rgba(251,113,133,0.18)',  // rose
    E:      'rgba(250,204,21,0.18)',   // yellow
    CENTER: 'rgba(167,139,250,0.18)', // violet
  };
  return colors[direction] ?? 'rgba(100,100,100,0.10)';
}

/** Convert direction shortcode to full label for display */
export function formatDirection(direction: string): string {
  const labels: Record<string, string> = {
    N: 'North', NE: 'North-East', E: 'East', SE: 'South-East',
    S: 'South', SW: 'South-West', W: 'West', NW: 'North-West',
    CENTER: 'Center',
  };
  return labels[direction] ?? direction;
}

/** Return the worst status from a list of statuses (for category summary) */
export function worstStatus(statuses: VastuRuleStatus[]): VastuRuleStatus {
  const order: VastuRuleStatus[] = ['violation', 'warning', 'acceptable', 'pass', 'preferred', 'not-applicable'];
  for (const s of order) {
    if (statuses.includes(s)) return s;
  }
  return 'not-applicable';
}

/** Category display labels */
export const CATEGORY_LABELS: Record<string, string> = {
  entrance:         'Entrance',
  kitchen:          'Kitchen',
  'master-bedroom': 'Master Bedroom',
  bedrooms:         'Bedrooms',
  'pooja-room':     'Pooja / Prayer',
  'bathroom-toilet': 'Bathrooms',
  staircase:        'Staircase',
  'living-area':    'Living Room',
  parking:          'Parking',
  garden:           'Garden / Open Space',
  brahmasthan:      'Brahmasthan (Center)',
  general:          'General Layout',
};
