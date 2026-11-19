import type { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/healthService.js';

export class HealthController {
  public static async getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await HealthService.getHealth();
      const { isHealthy, ...responseBody } = result;

      if (!isHealthy) {
        res.status(503).json(responseBody);
        return;
      }

      res.status(200).json(responseBody);
    } catch (err) {
      next(err);
    }
  }
}
