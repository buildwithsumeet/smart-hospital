import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('HTTP');

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const correlationId = (req.headers['x-correlation-id'] as string) || 
    Math.random().toString(36).substring(2, 10);
  
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      correlationId,
      status: res.statusCode,
      method: req.method,
      path: req.originalUrl,
      durationMs: duration
    });
  });

  next();
};
