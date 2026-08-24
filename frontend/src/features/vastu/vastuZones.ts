/**
 * vastuZones.ts — Vastu Zone Generation
 *
 * Generates the 9-zone (3×3 + center) Vastu mandala from a plot.
 * Architecture allows future extension to 16, 32, or 64 zone systems.
 *
 * Zone grid (see vastuGeometry.ts for coordinate system):
 *
 *   ny=0 ┌─────────┬─────────┬─────────┐
 *  (N)   │   NW    │    N    │   NE    │
 *        ├─────────┼─────────┼─────────┤
 *        │    W    │ CENTER  │    E    │
 *        ├─────────┼─────────┼─────────┤
 *   ny=1 │   SW    │    S    │   SE    │
 *  (S)   └─────────┴─────────┴─────────┘
 *        nx=0                       nx=1
 *       (W)                         (E)
 */

import type { Plot, VastuDirection, VastuZone, VastuZoneMap, NormalizedBounds } from '@vastuplan/shared';
import { VASTU_DIRECTION_LABELS } from '@vastuplan/shared';
import {
  DEFAULT_ZONE_CONFIG,
  normalizedToWorldBounds,
  getWorldBoundsCenter,
} from './vastuGeometry';
import type { VastuZoneConfig } from './vastuGeometry';

// ── All 9 Vastu directions in the 3×3 system ─────────────────────────────────

export const ALL_VASTU_DIRECTIONS: VastuDirection[] = [
  'NW', 'N', 'NE',
  'W',  'CENTER', 'E',
  'SW', 'S', 'SE',
];

// ── Zone normalized bounds factory ───────────────────────────────────────────

/**
 * Compute the normalized [0,1] bounding box for each of the 9 zones.
 * Uses configurable center-zone boundaries.
 */
function computeZoneBounds(
  config: VastuZoneConfig
): Record<VastuDirection, NormalizedBounds> {
  const { centerXStart: cx1, centerXEnd: cx2, centerYStart: cy1, centerYEnd: cy2 } = config;

  return {
    // Top row (North)
    NW:     { minX: 0,   minY: 0,   maxX: cx1, maxY: cy1 },
    N:      { minX: cx1, minY: 0,   maxX: cx2, maxY: cy1 },
    NE:     { minX: cx2, minY: 0,   maxX: 1,   maxY: cy1 },
    // Middle row
    W:      { minX: 0,   minY: cy1, maxX: cx1, maxY: cy2 },
    CENTER: { minX: cx1, minY: cy1, maxX: cx2, maxY: cy2 },
    E:      { minX: cx2, minY: cy1, maxX: 1,   maxY: cy2 },
    // Bottom row (South)
    SW:     { minX: 0,   minY: cy2, maxX: cx1, maxY: 1   },
    S:      { minX: cx1, minY: cy2, maxX: cx2, maxY: 1   },
    SE:     { minX: cx2, minY: cy2, maxX: 1,   maxY: 1   },
  };
}

// ── Zone Map Builder ──────────────────────────────────────────────────────────

/**
 * Build the complete VastuZoneMap for a plot.
 *
 * Each zone contains both normalizedBounds (for the Vastu engine logic)
 * and worldBounds (for Konva canvas rendering).
 *
 * This function is the single source of zone geometry — both the
 * analysis engine and the heatmap layer call this.
 *
 * @param plot - The project plot (provides world dimensions)
 * @param config - Zone configuration (default: equal thirds)
 */
export function buildVastuZoneMap(
  plot: Plot,
  config: VastuZoneConfig = DEFAULT_ZONE_CONFIG
): VastuZoneMap {
  const bounds = computeZoneBounds(config);
  const zoneMap: VastuZoneMap = {};

  for (const dir of ALL_VASTU_DIRECTIONS) {
    const nb = bounds[dir];
    const worldBounds = normalizedToWorldBounds(nb, plot);
    const center = getWorldBoundsCenter(worldBounds);

    zoneMap[dir] = {
      id: dir,
      direction: dir,
      label: VASTU_DIRECTION_LABELS[dir],
      normalizedBounds: nb,
      worldBounds,
      center,
    } satisfies VastuZone;
  }

  return zoneMap;
}

/**
 * Get a single zone from a zone map, with a null-safe return.
 */
export function getZoneFromMap(
  zoneMap: VastuZoneMap,
  direction: VastuDirection
): VastuZone | null {
  return zoneMap[direction] ?? null;
}

// ── Traditional zone associations (for documentation / UI tooltips) ───────────

/**
 * Traditional Vastu element and energy associations per direction.
 * These are informational only — rules are in vastuRules.ts.
 * Source: traditional-v1 rule set.
 */
export const VASTU_ZONE_ASSOCIATIONS: Record<VastuDirection, { element: string; deity: string; quality: string }> = {
  NE:     { element: 'Water',  deity: 'Ishanya',  quality: 'Spiritual, Wisdom, Clarity' },
  N:      { element: 'Water',  deity: 'Kubera',   quality: 'Wealth, Prosperity, Health' },
  NW:     { element: 'Air',    deity: 'Vayu',     quality: 'Support, Movement, Relations' },
  W:      { element: 'Water',  deity: 'Varuna',   quality: 'Stability, Gains, Fame' },
  SW:     { element: 'Earth',  deity: 'Nairitya', quality: 'Stability, Strength, Security' },
  S:      { element: 'Earth',  deity: 'Yama',     quality: 'Rest, Sleep, Discipline' },
  SE:     { element: 'Fire',   deity: 'Agni',     quality: 'Energy, Cooking, Transformation' },
  E:      { element: 'Space',  deity: 'Indra',    quality: 'Health, Sunrise, New Beginnings' },
  CENTER: { element: 'Space',  deity: 'Brahma',   quality: 'Cosmic Center — should remain open' },
};
