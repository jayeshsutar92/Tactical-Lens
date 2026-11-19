import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logging.js';
import { apiV1Router } from './routes/index.js';

export function createApp(): Express {
  const app = express();

  // 1. CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, true); // Dev-friendly fallback
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    })
  );

  // 2. Request Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 3. Structured Request Logging
  app.use(requestLogger);

  // 4. Root Welcome & Metadata Endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      message: `Welcome to ${config.projectName}`,
      version: config.version,
      environment: config.env,
      status: 'running',
      api_prefix: config.apiPrefix,
    });
  });

  // 5. Versioned API Router
  app.use(config.apiPrefix, apiV1Router);

  // 6. 404 Handler for Unmatched Routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint '${req.method} ${req.originalUrl}' does not exist`,
      },
      detail: `Endpoint '${req.method} ${req.originalUrl}' does not exist`,
    });
  });

  // 7. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
