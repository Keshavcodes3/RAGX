"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Eye, EyeOff, Lock, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { PageHead } from "../../../components/dashboard/ui";

const NAV = ["General", "Embeddings", "Retrieval", "Environment Variables"] as const;
type Tab = (typeof NAV)[number];

const inputCls =
  "w-full rounded-md border border-[#E8E8ED] bg-white px-3 py-2 text-[14px] outline-none transition-colors focus:border-[#1D1D1F]";

interface EnvVar {
  id: string;
  key: string;
  envs: string[];
  lastRevealed: string;
}

const SEED_ENVS: EnvVar[] = [
  { id: "e1", key: "GROQ_API_KEY", envs: ["Production"], lastRevealed: "2d ago" },
  { id: "e2", key: "OPENAI_API_KEY", envs: ["Preview", "Development"], lastRevealed: "Never" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("General");

  // general
  const [name, setName] = useState("Docs Assistant");
  const [savedGeneral, setSavedGeneral] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // embeddings
  const [embedding, setEmbedding] = useState("hosted-384");
  const [endpoint, setEndpoint] = useState("");
  const [savedEmbed, setSavedEmbed] = useState(false);

  // retrieval
  const [topK, setTopK] = useState("5");
  const [minScore, setMinScore] = useState("0.70");
  const [rerank, setRerank] = useState(true);
  const [savedRet, setSavedRet] = useState(false);

  // env vars
  const [envs, setEnvs] = useState<EnvVar[]>(SEED_ENVS);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [showVal, setShowVal] = useState(false);
  const [shown, setShown] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(15);

  useEffect(() => {
    if (!shown) return;
    setRemaining(15);
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          setShown(null);
          return 15;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [shown]);

  const confirmReveal = (id: string) => {
    setEnvs((l) => l.map((v) => (v.id === id ? { ...v, lastRevealed: "Just now" } : v)));
    setConfirming(null);
    setShown(id);
  };

  const addEnv = () => {
    const k = newKey.trim();
    if (!k || !newVal.trim()) return;
    setEnvs((l) => [{ id: `e${Date.now()}`, key: k, envs: ["Production", "Preview", "Development"], lastRevealed: "Never" }, ...l]);
    setNewKey("");
    setNewVal("");
  };

  return (
    <div>
      <PageHead title="Settings" sub="Project configuration." />

      <div className="mt-6 grid gap-8 lg:grid-cols-[190px_1fr]">
        {/* sub nav */}
        <nav className="flex gap-1 overflow-x-auto lg:sticky lg:top-20 lg:flex-col lg:self-start">
          {NAV.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-left text-[13.5px] transition-colors ${
                tab === t ? "bg-[#F5F5F7] font-medium text-[#1D1D1F]" : "text-[#6E6E73] hover:text-[#1D1D1F]"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="min-w-0"
        >
          {tab === "General" && (
            <div>
              <h2 className="text-[17px] font-semibold">General</h2>
              <div className="mt-4 rounded-lg border border-[#E8E8ED]">
                <div className="border-b border-[#E8E8ED] px-5 py-4">
                  <p className="text-[14px] font-medium">Project Name</p>
                  <p className="mt-0.5 text-[13px] text-[#6E6E73]">Used in the dashboard and API responses.</p>
                  <div className="mt-3 flex max-w-md gap-2">
                    <input
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setSavedGeneral(false);
                      }}
                      className={inputCls}
                    />
                    <button
                      onClick={() => setSavedGeneral(true)}
                      className="shrink-0 rounded-md bg-[#1D1D1F] px-4 py-2 text-[13px] font-medium text-white"
                    >
                      {savedGeneral ? "Saved" : "Save"}
                    </button>
                  </div>
                </div>
                <div className="border-b border-[#E8E8ED] px-5 py-4">
                  <p className="text-[14px] font-medium">Project Slug</p>
                  <p className="mt-0.5 text-[13px] text-[#6E6E73]">Immutable identifier used in URLs and API paths.</p>
                  <input value="docs-assistant" disabled className={`${inputCls} mt-3 max-w-md bg-[#F5F5F7] font-mono text-[#6E6E73]`} />
                </div>
                <div className="px-5 py-4">
                  <p className="text-[14px] font-medium text-red-600">Delete Project</p>
                  <p className="mt-0.5 text-[13px] text-[#6E6E73]">
                    Permanently removes documents, vectors and API keys. This cannot be undone.
                  </p>
                  {confirmDelete ? (
                    <span className="mt-3 flex gap-2">
                      <button className="rounded-md bg-red-600 px-4 py-2 text-[13px] font-medium text-white">
                        Confirm delete
                      </button>
                      <button onClick={() => setConfirmDelete(false)} className="rounded-md px-3 py-2 text-[13px] text-[#6E6E73]">
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="mt-3 flex items-center gap-1.5 rounded-md border border-red-200 px-4 py-2 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "Embeddings" && (
            <div>
              <h2 className="text-[17px] font-semibold">Embeddings</h2>
              <div className="mt-4 rounded-lg border border-[#E8E8ED]">
                {[
                  { id: "hosted-384", name: "Hosted · 384-dim", desc: "bge-small-en-v1.5 — smallest index, fastest search" },
                  { id: "hosted-768", name: "Hosted · 768-dim", desc: "nomic-embed-text — stronger recall, 2× storage" },
                  { id: "byo", name: "Custom endpoint", desc: "Your OpenAI-compatible inference URL" },
                ].map((o, i, arr) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      setEmbedding(o.id);
                      setSavedEmbed(false);
                    }}
                    className={`flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[#FAFAFA] ${
                      i < arr.length - 1 ? "border-b border-[#E8E8ED]" : ""
                    }`}
                  >
                    <span className={`grid size-4 shrink-0 place-items-center rounded-full border ${embedding === o.id ? "border-[#1D1D1F]" : "border-[#E8E8ED]"}`}>
                      {embedding === o.id && <span className="size-2 rounded-full bg-[#1D1D1F]" />}
                    </span>
                    <span>
                      <span className="block text-[14px] font-medium">
                        {o.name}
                        {o.id === "hosted-384" && (
                          <span className="ml-2 rounded-full bg-[#F5F5F7] px-2 py-0.5 font-mono text-[10.5px] text-[#6E6E73]">current</span>
                        )}
                      </span>
                      <span className="mt-0.5 block font-mono text-[12px] text-[#6E6E73]">{o.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
              {embedding === "byo" && (
                <input
                  value={endpoint}
                  onChange={(e) => {
                    setEndpoint(e.target.value);
                    setSavedEmbed(false);
                  }}
                  placeholder="https://embed.internal/v1"
                  className={`${inputCls} mt-3 font-mono`}
                />
              )}
              <p className="mt-3 font-mono text-xs text-[#6E6E73]">Vectors are versioned per model. Switching starts a background re-embed.</p>
              <button
                onClick={() => setSavedEmbed(true)}
                className="mt-3 flex items-center gap-1.5 rounded-md bg-[#1D1D1F] px-4 py-2 text-[13px] font-medium text-white"
              >
                {savedEmbed && <Check className="size-3.5" />} {savedEmbed ? "Saved" : "Save"}
              </button>
            </div>
          )}

          {tab === "Retrieval" && (
            <div>
              <h2 className="text-[17px] font-semibold">Retrieval</h2>
              <div className="mt-4 rounded-lg border border-[#E8E8ED]">
                <div className="grid border-b border-[#E8E8ED] sm:grid-cols-2">
                  <div className="border-b border-[#E8E8ED] px-5 py-4 sm:border-b-0 sm:border-r">
                    <p className="text-[14px] font-medium">Default Top K</p>
                    <p className="mt-0.5 text-[13px] text-[#6E6E73]">Chunks per query when omitted.</p>
                    <input
                      value={topK}
                      onChange={(e) => {
                        setTopK(e.target.value);
                        setSavedRet(false);
                      }}
                      inputMode="numeric"
                      className={`${inputCls} mt-3 font-mono`}
                    />
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-[14px] font-medium">Minimum Score</p>
                    <p className="mt-0.5 text-[13px] text-[#6E6E73]">Drop chunks below similarity.</p>
                    <input
                      value={minScore}
                      onChange={(e) => {
                        setMinScore(e.target.value);
                        setSavedRet(false);
                      }}
                      inputMode="decimal"
                      className={`${inputCls} mt-3 font-mono`}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setRerank((r) => !r);
                    setSavedRet(false);
                  }}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#FAFAFA]"
                >
                  <span>
                    <span className="block text-[14px] font-medium">Cross-encoder rerank</span>
                    <span className="mt-0.5 block font-mono text-[12px] text-[#6E6E73]">Re-score top 20 before returning top K</span>
                  </span>
                  <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${rerank ? "bg-[#0071E3]" : "bg-[#E8E8ED]"}`}>
                    <motion.span
                      animate={{ x: rerank ? 20 : 2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      className="absolute top-[3px] size-[18px] rounded-full bg-white shadow"
                    />
                  </span>
                </button>
              </div>
              <button
                onClick={() => setSavedRet(true)}
                className="mt-3 flex items-center gap-1.5 rounded-md bg-[#1D1D1F] px-4 py-2 text-[13px] font-medium text-white"
              >
                {savedRet && <Check className="size-3.5" />} {savedRet ? "Saved" : "Save"}
              </button>
            </div>
          )}

          {tab === "Environment Variables" && (
            <div>
              <h2 className="text-[17px] font-semibold">Environment Variables</h2>
              <p className="mt-1 text-[13px] text-[#6E6E73]">
                Provider keys for BYOK generation. Write-only by design.
              </p>

              {/* trust callout */}
              <div className="mt-4 flex gap-3 rounded-lg border border-[#0071E3]/25 bg-[#0071E3]/[0.04] px-4 py-3.5">
                <ShieldCheck className="size-5 shrink-0 text-[#0071E3]" />
                <div>
                  <p className="text-[14px] font-medium">You can trust us with your keys.</p>
                  <ul className="mt-1.5 space-y-1 font-mono text-[12px] text-[#6E6E73]">
                    <li className="flex items-center gap-1.5"><Lock className="size-3" /> Encrypted at rest — never stored in readable form</li>
                    <li className="flex items-center gap-1.5"><Lock className="size-3" /> Never returned by the API, never written to logs</li>
                    <li className="flex items-center gap-1.5"><Lock className="size-3" /> Every reveal is confirmed by you, timed, and audited</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-[#E8E8ED] p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="KEY — e.g. GROQ_API_KEY"
                    className={`${inputCls} font-mono`}
                  />
                  <div className="relative">
                    <input
                      type={showVal ? "text" : "password"}
                      value={newVal}
                      onChange={(e) => setNewVal(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addEnv()}
                      placeholder="Value"
                      className={`${inputCls} pr-10 font-mono`}
                    />
                    <button
                      onClick={() => setShowVal((s) => !s)}
                      aria-label={showVal ? "Hide value" : "Show value"}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E6E73] hover:text-[#1D1D1F]"
                    >
                      {showVal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <button
                    onClick={addEnv}
                    disabled={!newKey.trim() || !newVal.trim()}
                    className="flex items-center justify-center gap-1 rounded-md bg-[#1D1D1F] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40"
                  >
                    <Plus className="size-4" /> Add
                  </button>
                </div>
              </div>
              <div className="mt-3 divide-y divide-[#E8E8ED] rounded-lg border border-[#E8E8ED]">
                {envs.length === 0 && (
                  <p className="px-5 py-6 text-center text-sm text-[#6E6E73]">No variables yet. Add your first provider key above.</p>
                )}
                {envs.map((v) => {
                  const isShown = shown === v.id;
                  const isConfirming = confirming === v.id;
                  return (
                    <div key={v.id} className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <code className="font-mono text-[13px] font-medium">{v.key}</code>
                        <span className="font-mono text-[13px] text-[#6E6E73]">
                          {isShown ? "gsk_9f2a41bd77e04c1d8f3a" : "••••••••"}
                        </span>
                        {!isShown && !isConfirming && (
                          <button
                            onClick={() => setConfirming(v.id)}
                            className="font-mono text-xs text-[#6E6E73] hover:text-[#0071E3]"
                          >
                            Reveal
                          </button>
                        )}
                        <span className="ml-auto flex items-center gap-1.5">
                          {v.envs.map((e) => (
                            <span key={e} className="rounded border border-[#E8E8ED] bg-[#F5F5F7] px-1.5 py-0.5 font-mono text-[10.5px] text-[#6E6E73]">
                              {e}
                            </span>
                          ))}
                          <button
                            onClick={() => setEnvs((l) => l.filter((x) => x.id !== v.id))}
                            aria-label={`Delete ${v.key}`}
                            className="ml-1 grid size-7 place-items-center rounded-md text-[#6E6E73] transition-colors hover:text-red-600"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </span>
                      </div>

                      {/* confirm step */}
                      {isConfirming && (
                        <motion.div
                          initial={{ opacity: 0, y: -3 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2.5 flex flex-wrap items-center gap-2 rounded-lg bg-[#F5F5F7] px-3 py-2.5"
                        >
                          <p className="text-[13px]">
                            Reveal <code className="font-mono">{v.key}</code>? This access is logged.
                          </p>
                          <span className="ml-auto flex gap-2">
                            <button
                              onClick={() => confirmReveal(v.id)}
                              className="rounded-md bg-[#1D1D1F] px-3 py-1.5 text-[12.5px] font-medium text-white"
                            >
                              Reveal for 15s
                            </button>
                            <button
                              onClick={() => setConfirming(null)}
                              className="rounded-md px-2.5 py-1.5 text-[12.5px] text-[#6E6E73]"
                            >
                              Cancel
                            </button>
                          </span>
                        </motion.div>
                      )}

                      {/* revealed state with auto-hide */}
                      {isShown && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5">
                          <div className="h-1 overflow-hidden rounded-full bg-[#E8E8ED]">
                            <motion.div
                              key={remaining}
                              initial={{ width: `${(remaining / 15) * 100}%` }}
                              animate={{ width: `${((remaining - 1) / 15) * 100}%` }}
                              transition={{ duration: 1, ease: "linear" }}
                              className="h-full rounded-full bg-[#0071E3]"
                            />
                          </div>
                          <p className="mt-1.5 font-mono text-[11px] text-[#6E6E73]">
                            Visible for {remaining}s · this access was logged · revealed {v.lastRevealed === "Just now" ? "just now" : v.lastRevealed}
                          </p>
                        </motion.div>
                      )}

                      {!isShown && !isConfirming && (
                        <p className="mt-1 font-mono text-[11px] text-[#6E6E73]">
                          Last revealed {v.lastRevealed.toLowerCase()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
