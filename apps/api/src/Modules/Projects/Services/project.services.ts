import { ProjectRepository } from "../Repository/project.repo";

import type {
  CreateApiKeyInput,
  CreateProjectInput,
  UpdateProjectInput,
} from "@repo/types";

export class ProjectService {
  constructor(
    private readonly projectRepository = new ProjectRepository(),
  ) {}


  async createProject(data: CreateProjectInput) {
    const project = await this.projectRepository.create(data);

    if (!project) {
      throw new Error("Failed to create project");
    }

    const apiKey = await this.projectRepository.createApiKey(
      project.id,
      "Default",
    );

    return {
      project,
      apiKey,
    };
  }

  async getProject(projectId: string) {
    const project =
      await this.projectRepository.findById(projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    return project;
  }

  async getUserProjects(userId: string) {
    return this.projectRepository.findByUserId(userId);
  }

  async updateProject(
    projectId: string,
    data: UpdateProjectInput,
  ) {
    const project =
      await this.projectRepository.findById(projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    const updatedProject =
      await this.projectRepository.update(projectId, data);

    if (!updatedProject) {
      throw new Error("Failed to update project");
    }

    return updatedProject;
  }

  async deleteProject(projectId: string) {
    const project =
      await this.projectRepository.findById(projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    const deletedProject =
      await this.projectRepository.delete(projectId);

    if (!deletedProject) {
      throw new Error("Failed to delete project");
    }

    return deletedProject;
  }

  async createApiKey(
    data: CreateApiKeyInput,
  ) {
    const project =
      await this.projectRepository.findById(data.projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    return this.projectRepository.createApiKey(
      data.projectId,
      data.name,
    );
  }

  async getApiKeys(projectId: string) {
    const project =
      await this.projectRepository.findById(projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    return this.projectRepository.getApiKeys(projectId);
  }

  async getApiKey(
    projectId: string,
    apiKeyId: string,
  ) {
    const apiKey =
      await this.projectRepository.getApiKey(
        projectId,
        apiKeyId,
      );

    if (!apiKey) {
      throw new Error("API key not found");
    }

    return apiKey;
  }

  async revokeApiKey(
    projectId: string,
    apiKeyId: string,
  ) {
    const apiKey =
      await this.projectRepository.getApiKey(
        projectId,
        apiKeyId,
      );

    if (!apiKey) {
      throw new Error("API key not found");
    }

    if (apiKey.revokedAt) {
      throw new Error("API key is already revoked");
    }

    const revokedKey =
      await this.projectRepository.revokeApiKey(
        projectId,
        apiKeyId,
      );

    if (!revokedKey) {
      throw new Error("Failed to revoke API key");
    }

    return revokedKey;
  }

  async authenticateApiKey(keyHash: string) {
    const apiKey =
      await this.projectRepository.findApiKeyByHash(
        keyHash,
      );

    if (!apiKey) {
      throw new Error("Invalid or revoked API key");
    }

    const project =
      await this.projectRepository.findById(
        apiKey.projectId,
      );

    if (!project) {
      throw new Error("Project not found");
    }

    return {
      apiKey,
      project,
    };
  }
}
