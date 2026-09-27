import { Router } from "express";

import { DocumentController } from "../../Documents/Controller/document.controller";
import { ProjectController } from "../Controller/project.controller";
import { ProviderController } from "../../Providers/Controller/provider.controller";
import { authenticate } from "../../Auth/middleware/authenticate";

const router = Router();

const projectController = new ProjectController();
const providerController = new ProviderController();
const documentController = new DocumentController();

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

router.post(
  "/:projectId/api-keys/:apiKeyId/rotate",
  authenticate,
  projectController.rotateApiKey.bind(projectController),
);

// ----------------------------------------
// PROVIDERS
// ----------------------------------------

router.get(
  "/:projectId/providers",
  authenticate,
  providerController.getProviders.bind(providerController),
);

router.put(
  "/:projectId/providers/embedding",
  authenticate,
  providerController.saveEmbedding.bind(providerController),
);

router.delete(
  "/:projectId/providers/embedding",
  authenticate,
  providerController.deleteEmbedding.bind(providerController),
);

router.put(
  "/:projectId/providers/vector-store",
  authenticate,
  providerController.saveVectorStore.bind(providerController),
);

router.delete(
  "/:projectId/providers/vector-store",
  authenticate,
  providerController.deleteVectorStore.bind(providerController),
);

// ----------------------------------------
// DOCUMENTS (dashboard session auth; the
// project comes from the path and is
// ownership-checked, never trusted blindly)
// ----------------------------------------

router.post(
  "/:projectId/documents",
  authenticate,
  documentController.dashboardUploadBatch.bind(documentController),
);

router.get(
  "/:projectId/documents",
  authenticate,
  documentController.dashboardList.bind(documentController),
);

router.get(
  "/:projectId/documents/:documentId",
  authenticate,
  documentController.dashboardGet.bind(documentController),
);

router.delete(
  "/:projectId/documents/:documentId",
  authenticate,
  documentController.dashboardRemove.bind(documentController),
);

export default router;
