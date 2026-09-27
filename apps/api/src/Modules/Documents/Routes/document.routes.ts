import { Router } from "express";

import { authenticateApiKey } from "../../Auth/middleware/authenticateApiKey";
import { DocumentController } from "../Controller/document.controller";

const router = Router();

const documentController = new DocumentController();

router.post(
  "/documents",
  authenticateApiKey,
  documentController.upload.bind(documentController),
);

router.post(
  "/documents/batch",
  authenticateApiKey,
  documentController.uploadBatch.bind(documentController),
);

router.get(
  "/documents",
  authenticateApiKey,
  documentController.list.bind(documentController),
);

router.get(
  "/documents/:documentId",
  authenticateApiKey,
  documentController.get.bind(documentController),
);

router.delete(
  "/documents/:documentId",
  authenticateApiKey,
  documentController.remove.bind(documentController),
);

router.post(
  "/search",
  authenticateApiKey,
  documentController.search.bind(documentController),
);

router.post(
  "/ask",
  authenticateApiKey,
  documentController.ask.bind(documentController),
);

export default router;
