// NOTE: shared Express middleware (cross-cutting concerns only).
//
// Domain auth (`Modules/Auth/middleware/*`) stays where it is — this folder
// owns app-wide concerns: error mapping, async-handler wrapping, 404s.
// Keeping them here prevents every controller from re-implementing the
// same try/catch → status-code translation.

import type { NextFunction, Request, Response } from "express";

import { getErrorMessage, getStatusCode } from "@/Utils/httpError";

/**
 * Wraps async route handlers so rejected promises reach the global error
 * middleware instead of crashing the process (Express 5 still benefits
 * from explicit forwarding for consistent JSON error shape).
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

/**
 * Final error backstop. Controllers already translate known errors inline;
 * this handles anything that escapes (async errors, middleware throws).
 * Response shape matches controllers: `{ success: false, message }`.
 */
export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // WHY: `getErrorMessage` logs non-Http errors server-side and returns a
  // safe fallback, so provider keys / connection strings / document text
  // can never leak through a 500 response body.
  const statusCode = getStatusCode(error);
  const message = getErrorMessage(error, "Internal server error");
  res.status(statusCode).json({ success: false, message });
}

/** Canonical JSON 404. Registered after all routes in `app.ts`. */
export function notFoundMiddleware(_req: Request, res: Response): void {
  res.status(404).json({ success: false, message: "Route not found" });
}
