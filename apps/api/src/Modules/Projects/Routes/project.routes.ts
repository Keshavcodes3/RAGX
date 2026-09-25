import { Router } from "express";

import { ProjectController } from "../Controller/project.controller";
import { authenticate } from "../../Auth/middleware/authenticate";

const router = Router();

const projectController = new ProjectController();

// ----------------------------------------
// PROJECTS
// ----------------------------------------

router.post(
  "/",
  authenticate,
  projectController.createProject.bind(projectController),
);

router.get(
  "/",
  authenticate,
  projectController.getUserProjects.bind(projectController),
);

router.get(
  "/:projectId",
  authenticate,
  projectController.getProject.bind(projectController),
);

router.patch(
  "/:projectId",
  authenticate,
  projectController.updateProject.bind(projectController),
);

router.delete(
  "/:projectId",
  authenticate,
  projectController.deleteProject.bind(projectController),
);

// ----------------------------------------
// API KEYS
// ----------------------------------------

router.post(
  "/:projectId/api-keys",
  authenticate,
  projectController.createApiKey.bind(projectController),
);

router.get(
  "/:projectId/api-keys",
  authenticate,
  projectController.getApiKeys.bind(projectController),
);

router.get(
  "/:projectId/api-keys/:apiKeyId",
  authenticate,
  projectController.getApiKey.bind(projectController),
);

router.delete(
  "/:projectId/api-keys/:apiKeyId",
  authenticate,
  projectController.revokeApiKey.bind(projectController),
);

export default router;
