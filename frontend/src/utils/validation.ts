import type { CreateProjectPayload } from '@vastuplan/shared';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const VALID_SHAPES = ['rectangle', 'square', 'l-shaped', 'custom'];
const VALID_UNITS = ['feet', 'meters'];
const VALID_FACINGS = [
  'north', 'south', 'east', 'west',
  'north-east', 'north-west', 'south-east', 'south-west',
];

/**
 * Validate a project creation payload.
 */
export function validateProject(payload: Partial<CreateProjectPayload>): ValidationResult {
  const errors: ValidationError[] = [];

  // Project name
  if (!payload.name || payload.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Project name is required' });
  } else if (payload.name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Project name cannot exceed 100 characters' });
  }

  // Plot
  if (!payload.plot) {
    errors.push({ field: 'plot', message: 'Plot configuration is required' });
    return { valid: false, errors };
  }

  const { plot } = payload;

  // Shape
  if (!plot.shape || !VALID_SHAPES.includes(plot.shape)) {
    errors.push({ field: 'plot.shape', message: 'A valid plot shape must be selected' });
  }

  // Length
  if (plot.length === undefined || plot.length === null) {
    errors.push({ field: 'plot.length', message: 'Plot length is required' });
  } else if (isNaN(plot.length) || plot.length <= 0) {
    errors.push({ field: 'plot.length', message: 'Plot length must be a positive number' });
  } else if (plot.length > 10000) {
    errors.push({ field: 'plot.length', message: 'Plot length seems unrealistically large' });
  }

  // Width
  if (plot.width === undefined || plot.width === null) {
    errors.push({ field: 'plot.width', message: 'Plot width is required' });
  } else if (isNaN(plot.width) || plot.width <= 0) {
    errors.push({ field: 'plot.width', message: 'Plot width must be a positive number' });
  } else if (plot.width > 10000) {
    errors.push({ field: 'plot.width', message: 'Plot width seems unrealistically large' });
  }

  // Unit
  if (!plot.unit || !VALID_UNITS.includes(plot.unit)) {
    errors.push({ field: 'plot.unit', message: 'A valid unit must be selected (feet or meters)' });
  }

  // Facing
  if (!plot.facing || !VALID_FACINGS.includes(plot.facing)) {
    errors.push({ field: 'plot.facing', message: 'A valid facing direction must be selected' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get the error message for a specific field from a ValidationResult.
 */
export function getFieldError(result: ValidationResult, field: string): string | null {
  const error = result.errors.find((e) => e.field === field);
  return error ? error.message : null;
}

/**
 * Validate a dimension value (width or length).
 */
export function validateDimension(value: number | string): string | null {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'Must be a valid number';
  if (num <= 0) return 'Must be greater than 0';
  if (num > 10000) return 'Value seems unrealistically large';
  return null;
}
