import jwt from "jsonwebtoken";

import { envConfig } from "@/config/envConfig";

export interface AuthTokenPayload {
  sub: string;
}

const JWT_SECRET = (): string => envConfig.JWT_SECRET;

export function signAuthToken(userId: string): string {
  const payload: AuthTokenPayload = { sub: userId };

  return jwt.sign(payload, JWT_SECRET(), {
    expiresIn: envConfig.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET()) as AuthTokenPayload;

  if (!decoded || typeof decoded.sub !== "string" || decoded.sub.length === 0) {
    throw new Error("Invalid token payload");
  }

  return { sub: decoded.sub };
}
