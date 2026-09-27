"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Plus, RotateCw, Trash2, TriangleAlert } from "lucide-react";
import { apiKeys as seed } from "../../../components/dashboard/data";
import { PageHead } from "../../../components/dashboard/ui";

interface Key {
  id: string;
  name: string;
  env: "Production" | "Staging" | "Development";
  preview: string;
  created: string;
  lastUsed: string;
  scopes: string[];
}

const ENV_STYLE: Record<Key["env"], string> = {
  Production: "bg-[#0071E3]/10 text-[#0071E3]",
  Staging: "bg-[#F5F5F7] text-[#6E6E73]",
  Development: "bg-[#F5F5F7] text-[#6E6E73]",
};

const SEEDED: Key[] = seed.map((k, i) => ({
  ...k,
  env: (i === 0 ? "Production" : "Staging") as Key["env"],
  scopes: ["documents:read", "retrieval:search"],
}));

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<Key[]>(SEEDED);
  const [revealed, setRevealed] = useState<{ name: string; full: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [name, setName] = useState("");

  const copy = (text: string, tag: string) => {
    void navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(tag);
    setTimeout(() => setCopied((c) => (c === tag ? null : c)), 1400);
  };

  const mint = (keyName: string, env: Key["env"]): string =>
    `rgx_${env === "Production" ? "live" : "test"}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-6)}`;

  const create = () => {
    const clean = name.trim() || "Development";
    const full = mint(clean, "Development");
    setKeys((ks) => [
      {
        id: `k${Date.now()}`,
        name: clean,
        env: "Development",
        preview: `${full.slice(0, 9)}_••••••••••••••`,
        created: "Just now",
        lastUsed: "Never",
        scopes: ["documents:read", "retrieval:search"],
      },
      ...ks,
    ]);
    setRevealed({ name: clean, full });
    setName("");
    setComposing(false);
  };

  const rotate = (id: string) => {
    const target = keys.find((k) => k.id === id);
    if (!target) return;
    const full = mint(target.name, target.env);
    setKeys((ks) =>
      ks.map((k) =>
        k.id === id ? { ...k, preview: `${full.slice(0, 9)}_••••••••••••••`, lastUsed: "Never" } : k,
      ),
    );
    setRevealed({ name: `${target.name} (rotated)`, full });
  };

  return (
    <div>
      <PageHead
        title="API keys"
        sub="Keys used by your applications to access RAGX. Secrets are hashed at rest — only previews live here."
        right={
          <button
            onClick={() => setComposing((c) => !c)}
            className="rounded-md bg-[#1D1D1F] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black"
          >
            {composing ? "Close" : "Create API key"}
          </button>
        }
      />

      {composing && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex flex-col gap-2 rounded-lg border border-[#E8E8ED] p-3 sm:flex-row"
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="Key name — e.g. ios-app"
            className="w-full rounded-md border border-[#E8E8ED] bg-white px-3 py-2 font-mono text-[13px] outline-none focus:border-[#1D1D1F]"
          />
          <button
            onClick={create}
            className="shrink-0 rounded-md bg-[#1D1D1F] px-4 py-2 text-[13px] font-medium text-white"
          >
            Generate
          </button>
        </motion.div>
      )}

      {/* one-time reveal */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 overflow-hidden rounded-xl border border-[#0071E3]/30"
          >
            <div className="flex items-center gap-2 bg-[#0071E3]/[0.07] px-5 py-3 text-sm font-semibold text-[#0071E3]">
              <TriangleAlert className="size-4" />
              {revealed.name} — copy now, it will never be shown again.
            </div>
            <div className="flex flex-wrap items-center gap-2 bg-white px-5 py-4">
              <code className="min-w-0 flex-1 break-all rounded-lg border border-[#E8E8ED] bg-[#F5F5F7] px-3 py-2.5 font-mono text-[13px]">
                {revealed.full}
              </code>
              <button
                onClick={() => copy(revealed.full, "reveal")}
                className="flex items-center gap-1.5 rounded-lg bg-[#0071E3] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#0077ED]"
              >
                {copied === "reveal" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied === "reveal" ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => setRevealed(null)}
                className="rounded-lg px-3 py-2.5 text-[13px] text-[#6E6E73] transition-colors hover:text-[#1D1D1F]"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* key list */}
      <div className="mt-4 divide-y divide-[#E8E8ED] rounded-xl border border-[#E8E8ED]">
        {keys.map((k, i) => (
          <motion.div
            key={k.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(i * 0.05, 0.25) }}
            className="group px-5 py-4 transition-colors hover:bg-[#FAFAFA]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-2">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50" />
                  <span className="relative size-2 rounded-full bg-emerald-500" />
                </span>
                <p className="text-[15px] font-medium">{k.name}</p>
                <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${ENV_STYLE[k.env]}`}>
                  {k.env}
                </span>
              </div>
              <div className="flex items-center gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  onClick={() => rotate(k.id)}
                  className="flex items-center gap-1.5 rounded-md border border-[#E8E8ED] bg-white px-2.5 py-1.5 text-[12.5px] transition-colors hover:border-[#1D1D1F]/30"
                >
                  <RotateCw className="size-3.5" /> Rotate
                </button>
                {confirmRevoke === k.id ? (
                  <>
                    <button
                      onClick={() => setKeys((ks) => ks.filter((x) => x.id !== k.id))}
                      className="rounded-md bg-red-600 px-2.5 py-1.5 text-[12.5px] font-medium text-white"
                    >
                      Confirm revoke
                    </button>
                    <button
                      onClick={() => setConfirmRevoke(null)}
                      className="rounded-md px-2 py-1.5 text-[12.5px] text-[#6E6E73]"
                    >
                      Keep
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmRevoke(k.id)}
                    aria-label={`Revoke ${k.name}`}
                    className="grid size-[30px] place-items-center rounded-md border border-[#E8E8ED] bg-white text-[#6E6E73] transition-colors hover:border-red-300 hover:text-red-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => copy(k.preview, k.id)}
              title="Copy preview"
              className="mt-2.5 flex items-center gap-2 rounded-lg border border-[#E8E8ED] bg-[#F5F5F7]/60 px-3 py-2 font-mono text-[13px] transition-colors hover:border-[#1D1D1F]/25"
            >
              <span className="truncate">{k.preview}</span>
              {copied === k.id ? (
                <Check className="size-3.5 shrink-0 text-[#0071E3]" />
              ) : (
                <Copy className="size-3.5 shrink-0 text-[#6E6E73]" />
              )}
            </button>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {k.scopes.map((s) => (
                <span key={s} className="rounded border border-[#E8E8ED] bg-white px-1.5 py-0.5 font-mono text-[11px] text-[#6E6E73]">
                  {s}
                </span>
              ))}
              <span className="ml-auto font-mono text-[11px] text-[#6E6E73]">
                Created {k.created} · Last used {k.lastUsed}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-1.5 rounded-lg border border-[#E8E8ED] bg-white px-4 py-3 font-mono text-xs text-[#6E6E73]">
        <Plus className="size-3.5 rotate-45 shrink-0" />
        Need tighter access? Scope keys per collection — coming to this page next.
      </div>
    </div>
  );
}
