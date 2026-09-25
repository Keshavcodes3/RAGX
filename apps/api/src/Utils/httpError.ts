export class HttpError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "Invalid request") {
    super(400, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Resource not found") {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "Resource already exists") {
    super(409, message);
  }
}

export function getStatusCode(error: unknown, fallback = 500): number {
  if (error instanceof HttpError) {
    return error.statusCode;
  }
  return fallback;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpError) {
    return error.message;
  }
  if (error instanceof Error) {
    console.error(error);
  }
  return fallback;
}
