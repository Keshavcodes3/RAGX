import type { Request, Response } from "express";

import {
  getErrorMessage,
  getStatusCode,
} from "@/Utils/httpError";

import { AuthService } from "../Services/auth.services";
import { clearAuthCookie, setAuthCookie } from "../utils/authCookies";
import { signAuthToken } from "../utils/jwt";
import {
  loginSchema,
  registerSchema,
} from "../validation/auth.validation";

export class AuthController {
  constructor(
    private readonly authService = new AuthService(),
  ) {}

  async register(req: Request, res: Response) {
    try {
      const parsed = registerSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const user = await this.authService.register(parsed.data);
      const token = signAuthToken(user.id);
      setAuthCookie(res, token);

      return res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        success: false,
        message: getErrorMessage(error, "Failed to register"),
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const user = await this.authService.login(parsed.data);
      const token = signAuthToken(user.id);
      setAuthCookie(res, token);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        success: false,
        message: getErrorMessage(error, "Failed to login"),
      });
    }
  }

  async me(req: Request, res: Response) {
    try {
      const user = await this.authService.getCurrentUser(req.user.id);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        success: false,
        message: getErrorMessage(error, "Failed to fetch user"),
      });
    }
  }

  async logout(_req: Request, res: Response) {
    clearAuthCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }
}
