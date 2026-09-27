import { eq } from "drizzle-orm";

import { db } from "@config/database";
import {
  embeddingConfigTable,
  vectorStoreConfigTable,
} from "@db/schema";

import type {
  EmbeddingProvider,
  VectorStoreProvider,
} from "@repo/types";

export interface EmbeddingConfigRow {
  provider: string;
  model: string;
  encryptedApiKey: string;
  updatedAt: Date;
}

export interface VectorStoreConfigRow {
  provider: string;
  encryptedCredentials: string;
  updatedAt: Date;
}

export class ProviderRepository {
  private DB = db;

  async upsertEmbedding(
    projectId: string,
    data: {
      provider: EmbeddingProvider;
      model: string;
      encryptedApiKey: string;
    },
  ): Promise<EmbeddingConfigRow | undefined> {
    const [row] = await this.DB
      .insert(embeddingConfigTable)
      .values({
        projectId,
        provider: data.provider,
        model: data.model,
        encryptedApiKey: data.encryptedApiKey,
      })
      .onConflictDoUpdate({
        target: embeddingConfigTable.projectId,
        set: {
          provider: data.provider,
          model: data.model,
          encryptedApiKey: data.encryptedApiKey,
          updatedAt: new Date(),
        },
      })
      .returning({
        provider: embeddingConfigTable.provider,
        model: embeddingConfigTable.model,
        encryptedApiKey: embeddingConfigTable.encryptedApiKey,
        updatedAt: embeddingConfigTable.updatedAt,
      });

    return row;
  }

  async findEmbedding(projectId: string) {
    const [row] = await this.DB
      .select({
        provider: embeddingConfigTable.provider,
        model: embeddingConfigTable.model,
        encryptedApiKey: embeddingConfigTable.encryptedApiKey,
        updatedAt: embeddingConfigTable.updatedAt,
      })
      .from(embeddingConfigTable)
      .where(eq(embeddingConfigTable.projectId, projectId));

    return row;
  }

  async deleteEmbedding(projectId: string) {
    const [row] = await this.DB
      .delete(embeddingConfigTable)
      .where(eq(embeddingConfigTable.projectId, projectId))
      .returning({ id: embeddingConfigTable.id });

    return row;
  }

  async upsertVectorStore(
    projectId: string,
    data: {
      provider: VectorStoreProvider;
      encryptedCredentials: string;
    },
  ): Promise<VectorStoreConfigRow | undefined> {
    const [row] = await this.DB
      .insert(vectorStoreConfigTable)
      .values({
        projectId,
        provider: data.provider,
        encryptedCredentials: data.encryptedCredentials,
      })
      .onConflictDoUpdate({
        target: vectorStoreConfigTable.projectId,
        set: {
          provider: data.provider,
          encryptedCredentials: data.encryptedCredentials,
          updatedAt: new Date(),
        },
      })
      .returning({
        provider: vectorStoreConfigTable.provider,
        encryptedCredentials: vectorStoreConfigTable.encryptedCredentials,
        updatedAt: vectorStoreConfigTable.updatedAt,
      });

    return row;
  }

  async findVectorStore(projectId: string) {
    const [row] = await this.DB
      .select({
        provider: vectorStoreConfigTable.provider,
        encryptedCredentials: vectorStoreConfigTable.encryptedCredentials,
        updatedAt: vectorStoreConfigTable.updatedAt,
      })
      .from(vectorStoreConfigTable)
      .where(eq(vectorStoreConfigTable.projectId, projectId));

    return row;
  }

  async deleteVectorStore(projectId: string) {
    const [row] = await this.DB
      .delete(vectorStoreConfigTable)
      .where(eq(vectorStoreConfigTable.projectId, projectId))
      .returning({ id: vectorStoreConfigTable.id });

    return row;
  }
}
