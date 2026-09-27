"use client";

const BASE =
  process.env.NEXT_PUBLIC_RAGX_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string[]>;

  constructor(message: string, status: number, fields?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
}

export interface ApiKeyItem {
  id: string;
  projectId: string;
  name: string;
  keyPreview: string | null;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
}

export interface CreatedApiKey extends ApiKeyItem {
  /** Raw key, returned exactly once at creation/rotation. */
  key: string;
}

export interface EmbeddingMeta {
  provider: "openai" | "mistral";
  model: string;
  configured: true;
  apiKeyPreview: string;
  updatedAt: string;
}

export interface VectorStoreMeta {
  provider: "pinecone" | "qdrant" | "pgvector";
  configured: true;
  apiKeyPreview?: string;
  details: Record<string, string>;
  updatedAt: string;
}

export interface ProvidersState {
  embedding: EmbeddingMeta | null;
  vectorStore: VectorStoreMeta | null;
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method: init.method ?? "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
    data?: T;
  } | null;

  if (!res.ok) {
    throw new ApiError(
      json?.message ?? `Request failed (${res.status})`,
      res.status,
      json?.errors,
    );
  }

  return (json?.data ?? null) as T;
}

export const ragxApi = {
  me: () => request<{ id: string }>("/auth/me"),
  login: (email: string, password: string) =>
    request<{ id: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),

  projects: () => request<Project[]>("/projects"),

  apiKeys: (projectId: string) =>
    request<ApiKeyItem[]>(`/projects/${projectId}/api-keys`),
  createApiKey: (projectId: string, name: string) =>
    request<CreatedApiKey>(`/projects/${projectId}/api-keys`, {
      method: "POST",
      body: { name },
    }),
  rotateApiKey: (projectId: string, apiKeyId: string) =>
    request<CreatedApiKey>(`/projects/${projectId}/api-keys/${apiKeyId}/rotate`, {
      method: "POST",
    }),
  revokeApiKey: (projectId: string, apiKeyId: string) =>
    request<unknown>(`/projects/${projectId}/api-keys/${apiKeyId}`, {
      method: "DELETE",
    }),

  providers: (projectId: string) =>
    request<ProvidersState>(`/projects/${projectId}/providers`),
  saveEmbedding: (
    projectId: string,
    body: { provider: string; model: string; apiKey: string },
  ) =>
    request<EmbeddingMeta>(`/projects/${projectId}/providers/embedding`, {
      method: "PUT",
      body,
    }),
  deleteEmbedding: (projectId: string) =>
    request<unknown>(`/projects/${projectId}/providers/embedding`, {
      method: "DELETE",
    }),
  saveVectorStore: (projectId: string, body: Record<string, unknown>) =>
    request<VectorStoreMeta>(`/projects/${projectId}/providers/vector-store`, {
      method: "PUT",
      body,
    }),
  deleteVectorStore: (projectId: string) =>
    request<unknown>(`/projects/${projectId}/providers/vector-store`, {
      method: "DELETE",
    }),
};
