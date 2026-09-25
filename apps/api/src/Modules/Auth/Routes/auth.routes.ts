import { Router } from "express";

import { AuthController } from "../Controller/auth.controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

const authController = new AuthController();

router.post(
  "/register",
  authController.register.bind(authController),
);

router.post(
  "/login",
  authController.login.bind(authController),
);

router.post(
  "/logout",
  authController.logout.bind(authController),
);

router.get(
  "/me",
  authenticate,
  authController.me.bind(authController),
);

export default router;
