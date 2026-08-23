import { body, param } from 'express-validator';

const VALID_SHAPES = ['rectangle', 'square', 'l-shaped', 'custom'];
const VALID_UNITS = ['feet', 'meters'];
const VALID_FACINGS = [
  'north', 'south', 'east', 'west',
  'north-east', 'north-west', 'south-east', 'south-west',
];

export const validateCreateProject = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ max: 100 })
    .withMessage('Project name cannot exceed 100 characters'),

  body('plot').notEmpty().withMessage('Plot configuration is required'),

  body('plot.shape')
    .isIn(VALID_SHAPES)
    .withMessage(`Plot shape must be one of: ${VALID_SHAPES.join(', ')}`),

  body('plot.length')
    .isFloat({ min: 0.1 })
    .withMessage('Plot length must be a positive number greater than 0'),

  body('plot.width')
    .isFloat({ min: 0.1 })
    .withMessage('Plot width must be a positive number greater than 0'),

  body('plot.unit')
    .isIn(VALID_UNITS)
    .withMessage(`Unit must be one of: ${VALID_UNITS.join(', ')}`),

  body('plot.facing')
    .isIn(VALID_FACINGS)
    .withMessage(`Facing must be one of: ${VALID_FACINGS.join(', ')}`),
];

export const validateUpdateProject = [
  param('id').isMongoId().withMessage('Invalid project ID'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Project name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Project name cannot exceed 100 characters'),

  body('plot.shape')
    .optional()
    .isIn(VALID_SHAPES)
    .withMessage(`Plot shape must be one of: ${VALID_SHAPES.join(', ')}`),

  body('plot.length')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Plot length must be a positive number greater than 0'),

  body('plot.width')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Plot width must be a positive number greater than 0'),

  body('plot.unit')
    .optional()
    .isIn(VALID_UNITS)
    .withMessage(`Unit must be one of: ${VALID_UNITS.join(', ')}`),

  body('plot.facing')
    .optional()
    .isIn(VALID_FACINGS)
    .withMessage(`Facing must be one of: ${VALID_FACINGS.join(', ')}`),
];

export const validateProjectId = [
  param('id').isMongoId().withMessage('Invalid project ID'),
];
