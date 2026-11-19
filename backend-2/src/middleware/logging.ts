import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    const logData = {
      method,
      url: originalUrl,
      statusCode,
      durationMs: duration,
      clientIp: ip,
    };

    if (statusCode >= 500) {
      logger.error(`[HTTP] ${method} ${originalUrl} ${statusCode} - ${duration}ms`, logData);
    } else if (statusCode >= 400) {
      logger.warn(`[HTTP] ${method} ${originalUrl} ${statusCode} - ${duration}ms`, logData);
    } else {
      logger.info(`[HTTP] ${method} ${originalUrl} ${statusCode} - ${duration}ms`, logData);
    }
  });

  next();
}
