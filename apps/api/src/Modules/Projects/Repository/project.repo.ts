import { eq } from "drizzle-orm";
import { db } from "@config/database";
import { ApiKeys, projectTable } from "@db/schema";
import { generateApiKey, hashApiKey } from "@utils/generateApiKey";
import type {
  CreateApiKeyInput,
  CreateApiKeyResponse,
  CreateProjectInput,
} from "@repo/types";

export class ProjectRepository {
  private DB = db;

  async create(data: CreateProjectInput) {
    const { name, userId, description, apiKey } = data;

    const keyHash = hashApiKey(apiKey);

    const [createdProject] = await this.DB
      .insert(projectTable)
      .values({
        name,
        userId,
        description,
      })
      .returning();

    return createdProject;
  }

  async createApiKey(projectID:string,keyHash:string){
      await this.DB.insert(ApiKeys).values({
      projectId: projectID,
      name: "Default",
      keyHash,
    });
  }

  


}
