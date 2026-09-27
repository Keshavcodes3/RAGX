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

export type DocumentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface ApiDocument {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  chunks: number;
  createdAt: string;
}

export interface BatchDocumentSummary {
  id: string | null;
  filename: string;
  status: DocumentStatus;
  error?: string;
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

  projectDocuments: (projectId: string) =>
    request<ApiDocument[]>(`/projects/${projectId}/documents`),
  uploadProjectDocuments: (
    projectId: string,
    files: { filename: string; mimeType?: string; contentBase64: string }[],
  ) =>
    request<{ documents: BatchDocumentSummary[] }>(
      `/projects/${projectId}/documents`,
      { method: "POST", body: { files } },
    ),
  deleteProjectDocument: (projectId: string, documentId: string) =>
    request<unknown>(`/projects/${projectId}/documents/${documentId}`, {
      method: "DELETE",
    }),
};
