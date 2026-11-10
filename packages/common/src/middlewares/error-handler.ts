import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import { createLogger } from '../utils/logger';

const logger = createLogger('ErrorHandler');

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const correlationId = req.headers['x-correlation-id'] || 'N/A';

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[${correlationId}] Operational Server Error: ${err.message}`, {
        stack: err.stack,
        path: req.originalUrl
      });
    } else {
      logger.warn(`[${correlationId}] Client Error (${err.statusCode}): ${err.message}`, {
        errors: err.errors,
        path: req.originalUrl
      });
    }

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      statusCode: err.statusCode,
      errors: err.errors || null,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Unhandled / Unexpected Errors
  logger.error(`[${correlationId}] Unhandled Internal Error: ${err.message}`, {
    stack: err.stack,
    path: req.originalUrl
  });

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'An internal server error occurred' 
      : err.message,
    statusCode: 500,
    timestamp: new Date().toISOString()
  });
};
