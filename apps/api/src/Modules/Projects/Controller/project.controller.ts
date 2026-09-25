import type { Request, Response } from "express";

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
      const userId = (req as any).user.id;
      const { name, description } = req.body;

      const project =
        await this.projectService.createProject({
          userId,
          name,
          description,

          apiKey:""
        });

      return res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: project,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create project",
      });
    }
  }

  async getProject(
    req: Request<ProjectParams>,
    res: Response,
  ) {
    try {
      const { projectId } = req.params;

      const project =
        await this.projectService.getProject(projectId);

      return res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Project not found",
      });
    }
  }

  async getUserProjects(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const projects =
        await this.projectService.getUserProjects(userId);

      return res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch projects",
      });
    }
  }

  async updateProject(
    req: Request<ProjectParams>,
    res: Response,
  ) {
    try {
      const { projectId } = req.params;
      const { name, description } = req.body;

      const project =
        await this.projectService.updateProject(
          projectId,
          {
            name,
            description,
          },
        );

      return res.status(200).json({
        success: true,
        message: "Project updated successfully",
        data: project,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update project",
      });
    }
  }

  async deleteProject(
    req: Request<ProjectParams>,
    res: Response,
  ) {
    try {
      const { projectId } = req.params;

      const project =
        await this.projectService.deleteProject(projectId);

      return res.status(200).json({
        success: true,
        message: "Project deleted successfully",
        data: project,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete project",
      });
    }
  }

  // API KEYS

  async createApiKey(
    req: Request<ProjectParams>,
    res: Response,
  ) {
    try {
      const { projectId } = req.params;
      const { name } = req.body;

      const apiKey =
        await this.projectService.createApiKey({
          projectId,
          name,
        });

      return res.status(201).json({
        success: true,
        message: "API key created successfully",
        data: apiKey,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create API key",
      });
    }
  }

  async getApiKeys(
    req: Request<ProjectParams>,
    res: Response,
  ) {
    try {
      const { projectId } = req.params;

      const apiKeys =
        await this.projectService.getApiKeys(projectId);

      return res.status(200).json({
        success: true,
        data: apiKeys,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch API keys",
      });
    }
  }

  async getApiKey(
    req: Request<ApiKeyParams>,
    res: Response,
  ) {
    try {
      const { projectId, apiKeyId } = req.params;

      const apiKey =
        await this.projectService.getApiKey(
          projectId,
          apiKeyId,
        );

      return res.status(200).json({
        success: true,
        data: apiKey,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "API key not found",
      });
    }
  }

  async revokeApiKey(
    req: Request<ApiKeyParams>,
    res: Response,
  ) {
    try {
      const { projectId, apiKeyId } = req.params;

      const apiKey =
        await this.projectService.revokeApiKey(
          projectId,
          apiKeyId,
        );

      return res.status(200).json({
        success: true,
        message: "API key revoked successfully",
        data: apiKey,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to revoke API key",
      });
    }
  }
}
