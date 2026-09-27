import type { Request, Response } from "express";

import {
  getErrorMessage,
  getStatusCode,
} from "@/Utils/httpError";

import { ProviderService } from "../Services/provider.services";
import {
  embeddingConfigSchema,
  vectorStoreConfigSchema,
} from "../validation/provider.validation";

type ProjectParams = {
  projectId: string;
};

export class ProviderController {
  constructor(
    private readonly providerService = new ProviderService(),
  ) {}

  async getProviders(req: Request<ProjectParams>, res: Response) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: "Project ID is required",
        });
      }

      const providers = await this.providerService.getProviders(
        projectId,
        userId,
      );

      return res.status(200).json({
        success: true,
        data: providers,
      });
    } catch (error) {
      return res.status(getStatusCode(error, 404)).json({
        success: false,
        message: getErrorMessage(error, "Failed to fetch providers"),
      });
    }
  }

  async saveEmbedding(req: Request<ProjectParams>, res: Response) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: "Project ID is required",
        });
      }

      const parsed = embeddingConfigSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid embedding configuration",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const embedding = await this.providerService.saveEmbedding(
        projectId,
        userId,
        parsed.data,
      );

      return res.status(200).json({
        success: true,
        message: "Embedding configuration saved",
        data: embedding,
      });
    } catch (error) {
      return res.status(getStatusCode(error, 404)).json({
        success: false,
        message: getErrorMessage(error, "Failed to save embedding configuration"),
      });
    }
  }

  async deleteEmbedding(req: Request<ProjectParams>, res: Response) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: "Project ID is required",
        });
      }

      await this.providerService.deleteEmbedding(projectId, userId);

      return res.status(200).json({
        success: true,
        message: "Embedding configuration deleted",
      });
    } catch (error) {
      return res.status(getStatusCode(error, 404)).json({
        success: false,
        message: getErrorMessage(
          error,
          "Failed to delete embedding configuration",
        ),
      });
    }
  }

  async saveVectorStore(req: Request<ProjectParams>, res: Response) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: "Project ID is required",
        });
      }

      const parsed = vectorStoreConfigSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid vector store configuration",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const vectorStore = await this.providerService.saveVectorStore(
        projectId,
        userId,
        parsed.data,
      );

      return res.status(200).json({
        success: true,
        message: "Vector store configuration saved",
        data: vectorStore,
      });
    } catch (error) {
      return res.status(getStatusCode(error, 404)).json({
        success: false,
        message: getErrorMessage(
          error,
          "Failed to save vector store configuration",
        ),
      });
    }
  }

  async deleteVectorStore(req: Request<ProjectParams>, res: Response) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: "Project ID is required",
        });
      }

      await this.providerService.deleteVectorStore(projectId, userId);

      return res.status(200).json({
        success: true,
        message: "Vector store configuration deleted",
      });
    } catch (error) {
      return res.status(getStatusCode(error, 404)).json({
        success: false,
        message: getErrorMessage(
          error,
          "Failed to delete vector store configuration",
        ),
      });
    }
  }
}
