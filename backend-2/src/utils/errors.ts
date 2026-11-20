export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class EntityNotFoundError extends AppError {
  constructor(entityName: string, entityId: string) {
    super(`${entityName} with id '${entityId}' not found`, 404, 'ENTITY_NOT_FOUND');
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class DatabaseConnectionError extends AppError {
  constructor(message = 'Database connection unavailable', details?: unknown) {
    super(message, 503, 'DATABASE_UNAVAILABLE', details);
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, 503, 'CONFIGURATION_ERROR');
  }
}

export class AIProviderError extends AppError {
  constructor(message: string, statusCode = 502, details?: unknown) {
    super(message, statusCode, 'AI_PROVIDER_ERROR', details);
  }
}
