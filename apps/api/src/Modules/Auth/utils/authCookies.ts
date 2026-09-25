import type { CookieOptions, Response } from "express";

import { envConfig } from "@/config/envConfig";

export const AUTH_COOKIE_NAME = "access_token";

export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: envConfig.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...baseCookieOptions(),
  });
}
