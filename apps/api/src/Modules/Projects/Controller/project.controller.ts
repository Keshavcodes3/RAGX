import type { Request, Response } from "express";

import {
  getErrorMessage,
  getStatusCode,
} from "@/Utils/httpError";

import { ProjectService } from "../Services/project.services";

type ProjectParams = {
  projectId: string;
};

type ApiKeyParams = {
  projectId: string;
  apiKeyId: string;
};

export class ProjectController {
  constructor(
    private readonly projectService = new ProjectService(),
  ) {}

  // PROJECT

  async createProject(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { name, description } = req.body as {
        name?: unknown;
        description?: unknown;
      };

      if (typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Project name is required",
        });
      }

      if (
        description !== undefined &&
        typeof description !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid project description",
        });
      }

      const project = await this.projectService.createProject({
        userId,
        name: name.trim(),
        description,
      });

      return res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: project,
      });
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        success: false,
        message: getErrorMessage(error, "Failed to create project"),
      });
    }
  }

  async getProject(req: Request<ProjectParams>, res: Response) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: "Project ID is required",
        });
      }

      const project = await this.projectService.getProject(
        projectId,
        userId,
      );

      return res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      return res.status(getStatusCode(error, 404)).json({
        success: false,
        message: getErrorMessage(error, "Project not found"),
      });
    }
  }

  async getUserProjects(req: Request, res: Response) {
    try {
      const userId = req.user.id;

      const projects =
        await this.projectService.getUserProjects(userId);

      return res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        success: false,
        message: getErrorMessage(error, "Failed to fetch projects"),
      });
    }
  }

  async updateProject(req: Request<ProjectParams>, res: Response) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;
      const { name, description } = req.body as {
        name?: unknown;
        description?: unknown;
      };

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: "Project ID is required",
        });
      }

      if (
        (name !== undefined &&
          (typeof name !== "string" || name.trim().length === 0)) ||
        (description !== undefined && typeof description !== "string")
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid request",
        });
      }

      const project = await this.projectService.updateProject(
        projectId,
        userId,
        {
          ...(name !== undefined
            ? { name: (name as string).trim() }
            : {}),
          ...(description !== undefined
            ? { description: description as string }
            : {}),
        },
      );

      return res.status(200).json({
        success: true,
        message: "Project updated successfully",
        data: project,
      });
    } catch (error) {
      return res.status(getStatusCode(error, 404)).json({
        success: false,
        message: getErrorMessage(error, "Failed to update project"),
      });
    }
  }

  async deleteProject(req: Request<ProjectParams>, res: Response) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: "Project ID is required",
        });
      }

      const project = await this.projectService.deleteProject(
        projectId,
        userId,
      );

      return res.status(200).json({
        success: true,
        message: "Project deleted successfully",
        data: project,
      });
    } catch (error) {
      return res.status(getStatusCode(error, 404)).json({
        success: false,
        message: getErrorMessage(error, "Failed to delete project"),
      });
    }
  }

  // API KEYS

  async createApiKey(req: Request<ProjectParams>, res: Response) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;
      const { name } = req.body as { name?: unknown };

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: "Project ID is required",
        });
      }

      const keyName =
        typeof name === "string" && name.trim().length > 0
          ? name.trim()
          : "Default";

      const apiKey = await this.projectService.createApiKey(
        projectId,
        userId,
        keyName,
      );

      return res.status(201).json({
        success: true,
        message: "API key created successfully",
        data: apiKey,
      });
    } catch (error) {
      return res.status(getStatusCode(error, 404)).json({
        success: false,
        message: getErrorMessage(error, "Failed to create API key"),
      });
    }
  }

  async getApiKeys(req: Request<ProjectParams>, res: Response) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: "Project ID is required",
        });
      }

      const apiKeys = await this.projectService.getApiKeys(
        projectId,
        userId,
      );

      return res.status(200).json({
        success: true,
        data: apiKeys,
      });
    } catch (error) {
      return res.status(getStatusCode(error, 404)).json({
        success: false,
        message: getErrorMessage(error, "Failed to fetch API keys"),
      });
    }
  }

  async getApiKey(req: Request<ApiKeyParams>, res: Response) {
    try {
      const userId = req.user.id;
      const { projectId, apiKeyId } = req.params;

      if (!projectId || !apiKeyId) {
        return res.status(400).json({
          success: false,
          message: "Project ID and API key ID are required",
        });
      }

      const apiKey = await this.projectService.getApiKey(
        projectId,
        userId,
        apiKeyId,
      );

      return res.status(200).json({
        success: true,
        data: apiKey,
      });
    } catch (error) {
      return res.status(getStatusCode(error, 404)).json({
        success: false,
        message: getErrorMessage(error, "API key not found"),
      });
    }
  }

  async revokeApiKey(req: Request<ApiKeyParams>, res: Response) {
    try {
      const userId = req.user.id;
      const { projectId, apiKeyId } = req.params;

      if (!projectId || !apiKeyId) {
        return res.status(400).json({
          success: false,
          message: "Project ID and API key ID are required",
        });
      }

      const apiKey = await this.projectService.revokeApiKey(
        projectId,
        userId,
        apiKeyId,
      );

      return res.status(200).json({
        success: true,
        message: "API key revoked successfully",
        data: apiKey,
      });
    } catch (error) {
      return res.status(getStatusCode(error, 404)).json({
        success: false,
        message: getErrorMessage(error, "Failed to revoke API key"),
      });
    }
  }
}
