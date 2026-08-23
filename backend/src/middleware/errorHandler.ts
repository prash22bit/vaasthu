import { Request, Response, NextFunction } from 'express';

/**
 * Application-level error class.
 * Use this to throw controlled errors from controllers/services.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized error handler middleware.
 * Always returns a consistent JSON error response.
 * Never exposes raw stack traces or internal error details to the client in production.
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = process.env.NODE_ENV === 'development';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: isDev ? err.message : undefined,
      statusCode: 400,
    });
    return;
  }

  // Mongoose cast error (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      statusCode: 400,
    });
    return;
  }

  // Mongoose duplicate key error
  if ('code' in err && ((err as { code?: number | string }).code === 11000 || (err as { code?: number | string }).code === '11000')) {
    res.status(409).json({
      success: false,
      error: 'A record with this information already exists',
      statusCode: 409,
    });
    return;
  }

  // Operational errors (intentionally thrown with AppError)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details,
      statusCode: err.statusCode,
    });
    return;
  }

  // Unexpected errors — log them, return generic message
  console.error('❌ Unexpected error:', err);
  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred. Please try again.',
    statusCode: 500,
    ...(isDev && { debug: err.message }),
  });
}

/**
 * 404 handler — for unmatched routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
  });
}
