import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded']),
  database: z.enum(['connected', 'disconnected']),
  version: z.string(),
  environment: z.string(),
  timestamp: z.string().datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
