/**
 * index.ts — Vastu Feature Public API
 */

export { analyzeVastu } from './vastuEngine';
export { useVastuStore } from './vastuStore';
export { buildVastuZoneMap } from './vastuZones';
export { worldVectorToCompassDirection, getEntityCenter, getEntityBounds, classifyEntityZone } from './vastuGeometry';
export { TRADITIONAL_V1_RULES } from './vastuRules';
export { computeDesignHash, formatScoreLabel, statusColorClass, zoneHeatmapColor } from './vastuUtils';
export type { VastuZoneConfig } from './vastuGeometry';
