import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from backend-2 root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function parseCorsOrigins(raw?: string): string[] {
  if (!raw) return ['http://localhost:5173', 'http://localhost:3000'];
  if (raw.startsWith('[') && raw.endsWith(']')) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback to comma separated
    }
  }
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

function sanitizeDatabaseUrl(url?: string): string {
  if (!url) {
    return 'postgresql://postgres:postgres@localhost:5432/presslens';
  }
  // Convert python asyncpg format if user copies directly from backend/.env
  if (url.startsWith('postgresql+asyncpg://')) {
    return url.replace('postgresql+asyncpg://', 'postgresql://');
  }
  return url;
}

export const config = {
  env: process.env.NODE_ENV || process.env.APP_ENV || 'development',
  port: parseInt(process.env.PORT || '8000', 10),
  projectName: process.env.PROJECT_NAME || 'PressLens API (Node.js)',
  version: process.env.VERSION || '1.0.0',
  apiPrefix: process.env.API_V1_STR || '/api/v1',
  databaseUrl: sanitizeDatabaseUrl(process.env.DATABASE_URL),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  logLevel: process.env.LOG_LEVEL || 'info',
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  groqTimeoutMs: parseInt(process.env.GROQ_TIMEOUT_MS || '30000', 10),
  groqMaxRetries: parseInt(process.env.GROQ_MAX_RETRIES || '3', 10),
  embeddingModel: process.env.EMBEDDING_MODEL || 'Xenova/bge-small-en-v1.5',
  embeddingDimension: parseInt(process.env.EMBEDDING_DIMENSION || '384', 10),
} as const;

export type Config = typeof config;
