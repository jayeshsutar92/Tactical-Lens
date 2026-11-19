import { config } from '../config/env.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHTS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevelWeight = LEVEL_WEIGHTS[(config.logLevel.toLowerCase() as LogLevel) || 'info'] ?? 1;

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown> | Error | unknown) {
  const timestamp = new Date().toISOString();
  const logObject: Record<string, unknown> = {
    timestamp,
    level: level.toUpperCase(),
    message,
  };

  if (meta instanceof Error) {
    logObject.error = {
      name: meta.name,
      message: meta.message,
      stack: meta.stack,
    };
  } else if (meta && typeof meta === 'object') {
    Object.assign(logObject, meta);
  } else if (meta !== undefined) {
    logObject.data = meta;
  }

  return JSON.stringify(logObject);
}

export const logger = {
  debug(message: string, meta?: unknown) {
    if (currentLevelWeight <= LEVEL_WEIGHTS.debug) {
      console.debug(formatLog('debug', message, meta));
    }
  },
  info(message: string, meta?: unknown) {
    if (currentLevelWeight <= LEVEL_WEIGHTS.info) {
      console.info(formatLog('info', message, meta));
    }
  },
  warn(message: string, meta?: unknown) {
    if (currentLevelWeight <= LEVEL_WEIGHTS.warn) {
      console.warn(formatLog('warn', message, meta));
    }
  },
  error(message: string, meta?: unknown) {
    if (currentLevelWeight <= LEVEL_WEIGHTS.error) {
      console.error(formatLog('error', message, meta));
    }
  },
};
