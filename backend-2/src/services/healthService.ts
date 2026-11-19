import { config } from '../config/env.js';
import { checkDbConnection, checkSchemaReadiness } from '../db/index.js';
import type { HealthResponse } from '../schemas/health.js';

export interface HealthCheckResult extends HealthResponse {
  isHealthy: boolean;
}

export class HealthService {
  public static async getHealth(): Promise<HealthCheckResult> {
    const dbConnected = await checkDbConnection();
    const schemaReady = dbConnected ? await checkSchemaReadiness() : false;
    const isHealthy = dbConnected && schemaReady;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      database: dbConnected ? 'connected' : 'disconnected',
      version: config.version,
      environment: config.env,
      timestamp: new Date().toISOString(),
      isHealthy,
    };
  }
}
