import type { NextFunction, Request, Response } from "express";

import { AUTH_COOKIE_NAME } from "../utils/authCookies";
import { verifyAuthToken } from "../utils/jwt";

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return;
  }

  try {
    const decoded = verifyAuthToken(token);

    req.user = {
      id: decoded.sub,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
    return;
  }
}
