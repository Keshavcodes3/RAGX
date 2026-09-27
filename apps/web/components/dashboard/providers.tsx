"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Eye, EyeOff, Trash2 } from "lucide-react";
import { ApiError, ragxApi, type EmbeddingMeta, type VectorStoreMeta } from "../../lib/ragx-api";
import { useProjects } from "../../lib/project-context";
import { EmptyState } from "./ui";

const inputCls =
  "w-full rounded-md border border-[#E8E8ED] bg-white px-3 py-2 text-[14px] outline-none transition-colors focus:border-[#1D1D1F]";

const darkBtn =
  "rounded-md bg-[#1D1D1F] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black disabled:opacity-50";

function ErrorBanner({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-600">
      {error}
    </p>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[12px] text-red-600">{message}</p>;
}

function PreviewRow({ label, preview }: { label: string; preview: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-24 shrink-0 text-[13px] text-[#6E6E73]">{label}</span>
      <code className="rounded-md border border-[#E8E8ED] bg-[#F5F5F7]/60 px-3 py-1.5 font-mono text-[13px]">
        {preview}
      </code>
    </div>
  );
}

function useProvidersState() {
  const { projectId, authed } = useProjects();
  const [data, setData] = useState<{
    embedding: EmbeddingMeta | null;
    vectorStore: VectorStoreMeta | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!projectId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await ragxApi.providers(projectId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load providers.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { projectId, authed, data, loading, error, reload, setError };
}

const EMBEDDING_MODELS: Record<string, string[]> = {
  openai: ["text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002"],
  mistral: ["mistral-embed"],
};

export function EmbeddingSection() {
  const { projectId, authed, data, loading, error, reload, setError } =
    useProvidersState();
  const [editing, setEditing] = useState(false);
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("text-embedding-3-small");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const startEdit = () => {
    const current = data?.embedding;
    const nextProvider = current?.provider ?? "openai";
    setProvider(nextProvider);
    setModel(current?.model ?? EMBEDDING_MODELS[nextProvider]![0]!);
    setApiKey("");
    setFields({});
    setSaved(false);
    setEditing(true);
  };

  const save = async () => {
    if (!projectId) return;
    setBusy(true);
    setFields({});
    setError(null);
    try {
      await ragxApi.saveEmbedding(projectId, { provider, model, apiKey });
      setApiKey("");
      setSaved(true);
      setEditing(false);
      await reload();
    } catch (err) {
      if (err instanceof ApiError) {
        setFields(err.fields ?? {});
        setError(err.fields ? null : err.message);
      } else {
        setError("Failed to save configuration.");
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!projectId) return;
    setBusy(true);
    try {
      await ragxApi.deleteEmbedding(projectId);
      setConfirmDelete(false);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete configuration.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="mt-4 text-sm text-[#6E6E73]">Loading…</p>;
  if (!authed)
    return (
      <AuthRequired
        action={{ href: "/login", label: "Sign in" }}
        body="Sign in to configure an embedding provider for this project."
      />
    );
  if (!projectId)
    return (
      <EmptyState
        title="No project selected"
        body="Create a project first, then configure its embedding provider here."
        action={<span />}
      />
    );

  const current = data?.embedding;

  return (
    <div>
      <h2 className="text-[17px] font-semibold">Embeddings</h2>

      {error && <ErrorBanner error={error} />}
      {saved && !editing && (
        <p className="mt-3 flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-2 text-[13px] text-emerald-700">
          <Check className="size-3.5" /> Configuration saved.
        </p>
      )}

      {!current && !editing && (
        <EmptyState
          title="No embedding provider configured."
          body="Configure a provider to start processing documents."
          action={
            <button onClick={startEdit} className={darkBtn}>
              Configure embeddings
            </button>
          }
        />
      )}

      {current && !editing && (
        <div className="mt-4 rounded-lg border border-[#E8E8ED] px-5 py-4">
          <p className="text-[14px] font-medium capitalize">{current.provider}</p>
          <p className="mt-0.5 font-mono text-[12px] text-[#6E6E73]">{current.model}</p>
          <div className="mt-3 space-y-2">
            <PreviewRow label="API key" preview={`••••••••${current.apiKeyPreview.slice(-4)}`} />
          </div>
          <p className="mt-3 font-mono text-[11px] text-[#6E6E73]">
            The full key is never displayed or returned by the API.
          </p>
          <div className="mt-3 flex gap-2">
            <button onClick={startEdit} className={darkBtn}>
              Edit
            </button>
            {confirmDelete ? (
              <>
                <button
                  onClick={remove}
                  disabled={busy}
                  className="rounded-md bg-red-600 px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
                >
                  Confirm delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-md px-3 py-2 text-[13px] text-[#6E6E73]"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 rounded-md border border-[#E8E8ED] px-4 py-2 text-[13px] text-[#6E6E73] transition-colors hover:border-red-300 hover:text-red-600"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            )}
          </div>
        </div>
      )}

      {editing && (
        <div className="mt-4 rounded-lg border border-[#E8E8ED] px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="emb-provider" className="text-[13px] font-medium">
                Provider
              </label>
              <select
                id="emb-provider"
                value={provider}
                onChange={(e) => {
                  const next = e.target.value;
                  setProvider(next);
                  setModel(EMBEDDING_MODELS[next]![0]!);
                }}
                className={`${inputCls} mt-1.5`}
              >
                <option value="openai">OpenAI</option>
                <option value="mistral">Mistral</option>
              </select>
              <FieldError message={fields["provider"]?.[0]} />
            </div>
            <div>
              <label htmlFor="emb-model" className="text-[13px] font-medium">
                Model
              </label>
              <select
                id="emb-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={`${inputCls} mt-1.5 font-mono`}
              >
                {(EMBEDDING_MODELS[provider] ?? []).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <FieldError message={fields["model"]?.[0]} />
            </div>
          </div>
          <div className="mt-3">
            <label htmlFor="emb-key" className="text-[13px] font-medium">
              API Key
            </label>
            <div className="relative mt-1.5">
              <input
                id="emb-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="••••••••••••••••"
                autoComplete="off"
                className={`${inputCls} pr-10 font-mono`}
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                aria-label={showKey ? "Hide API key" : "Show API key"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E6E73] hover:text-[#1D1D1F]"
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <FieldError message={fields["apiKey"]?.[0]} />
            <p className="mt-1.5 font-mono text-[11px] text-[#6E6E73]">
              Encrypted at rest. Never returned by the API after saving.
            </p>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={save} disabled={busy} className={darkBtn}>
              {busy ? "Saving…" : "Save configuration"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-md px-3 py-2 text-[13px] text-[#6E6E73]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type VectorProvider = "pinecone" | "qdrant" | "pgvector";

export function VectorStoreSection() {
  const { projectId, authed, data, loading, error, reload, setError } =
    useProvidersState();
  const [editing, setEditing] = useState(false);
  const [provider, setProvider] = useState<VectorProvider>("pgvector");
  const [apiKey, setApiKey] = useState("");
  const [index, setIndex] = useState("");
  const [url, setUrl] = useState("");
  const [collection, setCollection] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const startEdit = () => {
    const current = data?.vectorStore;
    setProvider(current?.provider ?? "pgvector");
    setApiKey("");
    setIndex(current?.details["index"] ?? "");
    setUrl(current?.details["url"] ?? "");
    setCollection(current?.details["collection"] ?? "");
    setFields({});
    setSaved(false);
    setEditing(true);
  };

  const save = async () => {
    if (!projectId) return;
    setBusy(true);
    setFields({});
    setError(null);
    const body: Record<string, unknown> =
      provider === "pinecone"
        ? { provider, apiKey, index }
        : provider === "qdrant"
          ? {
              provider,
              url,
              collection,
              ...(apiKey.trim() ? { apiKey } : {}),
            }
          : { provider };
    try {
      await ragxApi.saveVectorStore(projectId, body);
      setApiKey("");
      setSaved(true);
      setEditing(false);
      await reload();
    } catch (err) {
      if (err instanceof ApiError) {
        setFields(err.fields ?? {});
        setError(err.fields ? null : err.message);
        if (!err.fields) setError(err.message);
      } else {
        setError("Failed to save configuration.");
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!projectId) return;
    setBusy(true);
    try {
      await ragxApi.deleteVectorStore(projectId);
      setConfirmDelete(false);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete configuration.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="mt-4 text-sm text-[#6E6E73]">Loading…</p>;
  if (!authed)
    return (
      <AuthRequired
        action={{ href: "/login", label: "Sign in" }}
        body="Sign in to configure a vector store for this project."
      />
    );
  if (!projectId)
    return (
      <EmptyState
        title="No project selected"
        body="Create a project first, then configure its vector store here."
        action={<span />}
      />
    );

  const current = data?.vectorStore;

  return (
    <div>
      <h2 className="text-[17px] font-semibold">Vector Store</h2>

      {error && <ErrorBanner error={error} />}
      {saved && !editing && (
        <p className="mt-3 flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-2 text-[13px] text-emerald-700">
          <Check className="size-3.5" /> Configuration saved.
        </p>
      )}

      {!current && !editing && (
        <EmptyState
          title="No vector store configured."
          body="Configure where embedded chunks are stored to enable search."
          action={
            <button onClick={startEdit} className={darkBtn}>
              Configure vector store
            </button>
          }
        />
      )}

      {current && !editing && (
        <div className="mt-4 rounded-lg border border-[#E8E8ED] px-5 py-4">
          <p className="text-[14px] font-medium capitalize">{current.provider}</p>
          <div className="mt-3 space-y-2">
            {Object.entries(current.details).map(([k, v]) => (
              <div key={k} className="flex flex-wrap items-center gap-3">
                <span className="w-24 shrink-0 text-[13px] text-[#6E6E73]">{k}</span>
                <code className="rounded-md border border-[#E8E8ED] bg-[#F5F5F7]/60 px-3 py-1.5 font-mono text-[13px]">
                  {v}
                </code>
              </div>
            ))}
            {current.apiKeyPreview && (
              <PreviewRow label="API key" preview={`••••••••${current.apiKeyPreview.slice(-4)}`} />
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={startEdit} className={darkBtn}>
              Edit
            </button>
            {confirmDelete ? (
              <>
                <button
                  onClick={remove}
                  disabled={busy}
                  className="rounded-md bg-red-600 px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
                >
                  Confirm delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-md px-3 py-2 text-[13px] text-[#6E6E73]"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 rounded-md border border-[#E8E8ED] px-4 py-2 text-[13px] text-[#6E6E73] transition-colors hover:border-red-300 hover:text-red-600"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            )}
          </div>
        </div>
      )}

      {editing && (
        <div className="mt-4 rounded-lg border border-[#E8E8ED] px-5 py-4">
          <div>
            <label htmlFor="vs-provider" className="text-[13px] font-medium">
              Provider
            </label>
            <select
              id="vs-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as VectorProvider)}
              className={`${inputCls} mt-1.5`}
            >
              <option value="pgvector">pgvector (managed Postgres)</option>
              <option value="pinecone">Pinecone</option>
              <option value="qdrant">Qdrant</option>
            </select>
            <FieldError message={fields["provider"]?.[0]} />
          </div>

          {provider === "pinecone" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="vs-index" className="text-[13px] font-medium">
                  Index
                </label>
                <input
                  id="vs-index"
                  value={index}
                  onChange={(e) => setIndex(e.target.value)}
                  placeholder="my-rag-index"
                  className={`${inputCls} mt-1.5 font-mono`}
                />
                <FieldError message={fields["index"]?.[0]} />
              </div>
              <div>
                <label htmlFor="vs-key" className="text-[13px] font-medium">
                  API Key
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="vs-key"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="••••••••••••••••"
                    autoComplete="off"
                    className={`${inputCls} pr-10 font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    aria-label={showKey ? "Hide API key" : "Show API key"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E6E73] hover:text-[#1D1D1F]"
                  >
                    {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <FieldError message={fields["apiKey"]?.[0]} />
              </div>
            </div>
          )}

          {provider === "qdrant" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="vs-url" className="text-[13px] font-medium">
                  URL
                </label>
                <input
                  id="vs-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyz.cloud.qdrant.io"
                  className={`${inputCls} mt-1.5 font-mono`}
                />
                <FieldError message={fields["url"]?.[0]} />
              </div>
              <div>
                <label htmlFor="vs-collection" className="text-[13px] font-medium">
                  Collection
                </label>
                <input
                  id="vs-collection"
                  value={collection}
                  onChange={(e) => setCollection(e.target.value)}
                  placeholder="docs"
                  className={`${inputCls} mt-1.5 font-mono`}
                />
                <FieldError message={fields["collection"]?.[0]} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="vs-qkey" className="text-[13px] font-medium">
                  API Key <span className="text-[#6E6E73]">(optional)</span>
                </label>
                <input
                  id="vs-qkey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="••••••••••••••••"
                  autoComplete="off"
                  className={`${inputCls} mt-1.5 font-mono`}
                />
                <FieldError message={fields["apiKey"]?.[0]} />
              </div>
            </div>
          )}

          {provider === "pgvector" && (
            <p className="mt-3 font-mono text-[12px] leading-relaxed text-[#6E6E73]">
              Uses RAGX-managed Postgres. No credentials needed — vectors stay
              in your project&apos;s database.
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button onClick={save} disabled={busy} className={darkBtn}>
              {busy ? "Saving…" : "Save configuration"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-md px-3 py-2 text-[13px] text-[#6E6E73]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuthRequired({
  body,
  action,
}: {
  body: string;
  action: { href: string; label: string };
}) {
  return (
    <EmptyState
      title="Sign in required"
      body={body}
      action={
        <a
          href={action.href}
          className="rounded-md bg-[#1D1D1F] px-4 py-2 text-[13px] font-medium text-white"
        >
          {action.label}
        </a>
      }
    />
  );
}
