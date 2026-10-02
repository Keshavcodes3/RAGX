import type { NextFunction, Request, Response } from "express";

import { hashApiKey } from "@/Utils/generateApiKey";

import { ProjectRepository } from "../../Projects/Repository/project.repo";

const projectRepository = new ProjectRepository();

/**
 * SDK authentication: `Authorization: Bearer <ragxApiKey>`.
 * Attaches the owning project; never logs the presented key.
 *
 * The project is always resolved server-side from the key hash — callers
 * can inject a repository (tests) but there is no path for a client to
 * supply its own projectId.
 */
export async function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
  repository: Pick<
    ProjectRepository,
    "findApiKeyByHash"
  > = projectRepository,
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

  const record = await repository.findApiKeyByHash(
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
