import type { NextFunction, Request, Response } from "express";

import { hashApiKey } from "@/Utils/generateApiKey";

import { ProjectRepository } from "../../Projects/Repository/project.repo";

const projectRepository = new ProjectRepository();

/**
 * SDK authentication: `Authorization: Bearer <ragxApiKey>`.
 * Attaches the owning project; never logs the presented key.
 */
export async function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Missing RAGX API key",
    });
    return;
  }

  const presented = header.slice("Bearer ".length).trim();

  if (!presented) {
    res.status(401).json({
      success: false,
      message: "Missing RAGX API key",
    });
    return;
  }

  const record = await projectRepository.findApiKeyByHash(
    hashApiKey(presented),
  );

  if (!record) {
    res.status(401).json({
      success: false,
      message: "Invalid or revoked API key",
    });
    return;
  }

  req.apiKeyContext = {
    projectId: record.projectId,
    keyId: record.id,
  };

  next();
}
