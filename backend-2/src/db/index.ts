import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import * as schema from './schema.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL client error in pool', err);
});

export const db = drizzle(pool, { schema });

/**
 * Verifies that the PostgreSQL database connection is operational.
 */
export async function checkDbConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error('PostgreSQL connectivity check failed:', err);
    return false;
  }
}

/**
 * Verifies that the required application tables exist (verifying table existence via to_regclass('public.scenarios')).
 */
export async function checkSchemaReadiness(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      const res = await client.query<{ table_ref: string | null }>(
        "SELECT to_regclass('public.scenarios') AS table_ref"
      );
      const tableRef = res.rows[0]?.table_ref;
      return tableRef !== null && tableRef !== undefined;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error('Schema readiness verification failed:', err);
    return false;
  }
}

/**
 * Closes the database pool connections.
 */
export async function closeDb(): Promise<void> {
  try {
    await pool.end();
    logger.info('Database pool successfully drained and closed.');
  } catch (err) {
    logger.error('Error closing database pool:', err);
  }
}

export * from './schema.js';
