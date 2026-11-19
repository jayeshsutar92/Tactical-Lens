import { createApp } from './app.js';
import { config } from './config/env.js';
import { checkDbConnection, checkSchemaReadiness, closeDb } from './db/index.js';
import { logger } from './utils/logger.js';

async function startServer() {
  const app = createApp();

  const server = app.listen(config.port, async () => {
    logger.info(`Starting up ${config.projectName} (v${config.version}) in '${config.env}' mode...`);
    logger.info(`Server is listening on http://localhost:${config.port}`);
    logger.info(`API Base URL: http://localhost:${config.port}${config.apiPrefix}`);

    // Verify database connectivity and schema readiness on boot
    const dbOk = await checkDbConnection();
    if (dbOk) {
      logger.info('PostgreSQL database connection established successfully.');
      const schemaOk = await checkSchemaReadiness();
      if (schemaOk) {
        logger.info('Database schema readiness confirmed: table public.scenarios exists.');
      } else {
        logger.warn(
          'Database connected, but schema is not ready: table public.scenarios was not found.'
        );
      }
    } else {
      logger.warn('PostgreSQL database connection could not be established during startup.');
    }
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down server gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await closeDb();
      process.exit(0);
    });

    // Force exit if shutdown hangs
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  logger.error('Fatal error during application startup:', err);
  process.exit(1);
});
