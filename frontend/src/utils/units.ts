import type { Unit } from '@vastuplan/shared';

// ---------------------------------------------------------------------------
// Conversion constants
// ---------------------------------------------------------------------------

const FT_PER_METER = 3.28084;
const METER_PER_FOOT = 0.3048;

// ---------------------------------------------------------------------------
// Conversion functions
// ---------------------------------------------------------------------------

/**
 * Convert feet to meters.
 */
export function feetToMeters(feet: number): number {
  return feet * METER_PER_FOOT;
}

/**
 * Convert meters to feet.
 */
export function metersToFeet(meters: number): number {
  return meters * FT_PER_METER;
}

/**
 * Convert a value from one unit to another.
 * Returns the same value if units are the same.
 */
export function convertUnit(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;
  if (from === 'feet' && to === 'meters') return feetToMeters(value);
  if (from === 'meters' && to === 'feet') return metersToFeet(value);
  return value;
}

/**
 * Calculate area in square units.
 */
export function calculateArea(width: number, length: number): number {
  return width * length;
}

/**
 * Format a dimension value for display.
 * Rounds to 2 decimal places and strips trailing zeros.
 */
export function formatDimension(value: number, unit: Unit, precision = 2): string {
  const unitSuffix = unit === 'feet' ? 'ft' : 'm';
  const rounded = parseFloat(value.toFixed(precision));
  return `${rounded} ${unitSuffix}`;
}

/**
 * Format area for display.
 */
export function formatArea(area: number, unit: Unit): string {
  const unitSuffix = unit === 'feet' ? 'sq.ft' : 'm²';
  const rounded = parseFloat(area.toFixed(2));
  return `${rounded} ${unitSuffix}`;
}

/**
 * Format a dimension as a short number string (no unit suffix).
 */
export function formatDimensionShort(value: number, precision = 2): string {
  return parseFloat(value.toFixed(precision)).toString();
}

/**
 * Get the full name of a unit.
 */
export function getUnitLabel(unit: Unit): string {
  return unit === 'feet' ? 'Feet' : 'Meters';
}

/**
 * Get the short suffix of a unit.
 */
export function getUnitSuffix(unit: Unit): string {
  return unit === 'feet' ? 'ft' : 'm';
}
