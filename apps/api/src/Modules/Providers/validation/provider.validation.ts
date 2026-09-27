import { z } from "zod";

export const embeddingConfigSchema = z.object({
  provider: z.enum(["openai", "mistral"], {
    message: "Provider must be openai or mistral",
  }),
  model: z
    .string()
    .trim()
    .min(1, "Model is required")
    .max(100, "Model name is too long"),
  apiKey: z
    .string()
    .min(8, "API key is required")
    .max(500, "API key is too long"),
});

export type EmbeddingConfigRequest = z.infer<typeof embeddingConfigSchema>;

const pineconeSchema = z.object({
  provider: z.literal("pinecone"),
  apiKey: z
    .string()
    .min(8, "API key is required")
    .max(500, "API key is too long"),
  index: z
    .string()
    .trim()
    .min(1, "Index is required for Pinecone")
    .max(200, "Index name is too long"),
});

const qdrantSchema = z.object({
  provider: z.literal("qdrant"),
  url: z
    .string()
    .trim()
    .min(1, "URL is required for Qdrant")
    .max(500, "URL is too long")
    .url("URL must be a valid URL"),
  collection: z
    .string()
    .trim()
    .min(1, "Collection is required for Qdrant")
    .max(200, "Collection name is too long"),
  apiKey: z.string().max(500, "API key is too long").optional(),
});

const pgvectorSchema = z.object({
  provider: z.literal("pgvector"),
  connectionString: z
    .string()
    .max(1000, "Connection string is too long")
    .optional(),
});

export const vectorStoreConfigSchema = z.discriminatedUnion("provider", [
  pineconeSchema,
  qdrantSchema,
  pgvectorSchema,
]);

export type VectorStoreConfigRequest = z.infer<typeof vectorStoreConfigSchema>;
