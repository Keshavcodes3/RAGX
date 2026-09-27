"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { projects as seed } from "../../../components/dashboard/data";
import { AnimatedNumber, EmptyState } from "../../../components/dashboard/ui";

export default function ProjectsPage() {
  const [items, setItems] = useState(seed);
  const [q, setQ] = useState("");
  const [composing, setComposing] = useState(false);
  const [name, setName] = useState("");

  const filtered = useMemo(
    () => items.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );
  const totals = useMemo(
    () => ({
      docs: items.reduce((s, p) => s + p.documents, 0),
      chunks: items.reduce((s, p) => s + p.chunks, 0),
    }),
    [items],
  );

  const create = () => {
    const clean = name.trim();
    if (!clean) return;
    const id = clean.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    setItems((list) => [{ id, name: clean, documents: 0, chunks: 0, updated: "now" }, ...list]);
    setName("");
    setComposing(false);
  };

  return (
    <div>
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[24px] font-semibold tracking-[-0.02em]">Projects</h1>
          <span className="rounded-full bg-[#F5F5F7] px-2 py-0.5 font-mono text-xs tabular-nums text-[#6E6E73]">
            {items.length}
          </span>
        </div>
        <button
          onClick={() => setComposing((c) => !c)}
          className="rounded-md bg-[#1D1D1F] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black"
        >
          {composing ? "Close" : "New Project"}
        </button>
      </div>

      {/* composer */}
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
            placeholder="my-knowledge-base"
            className="w-full rounded-md border border-[#E8E8ED] bg-white px-3 py-2 font-mono text-[13px] outline-none focus:border-[#1D1D1F]"
          />
          <button
            onClick={create}
            disabled={!name.trim()}
            className="shrink-0 rounded-md bg-[#1D1D1F] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40"
          >
            Create
          </button>
        </motion.div>
      )}

      {/* search */}
      <div className="mt-4 flex items-center gap-2 border-b border-[#E8E8ED] pb-2">
        <Search className="size-4 shrink-0 text-[#6E6E73]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search projects…"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#6E6E73]/50"
        />
        <span className="shrink-0 font-mono text-[11px] text-[#6E6E73]">
          {filtered.length}/{items.length}
        </span>
      </div>

      {/* list */}
      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={items.length === 0 ? "No projects yet." : `No results for “${q}”.`}
            body="Projects isolate documents, chunks and API keys per workspace."
            action={
              <button
                onClick={() => {
                  setComposing(true);
                  setName(q);
                }}
                className="rounded-md bg-[#1D1D1F] px-4 py-2 text-sm font-medium text-white"
              >
                New Project
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-1">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.04, 0.25) }}
            >
              <Link
                href="/dashboard/documents"
                className="group flex items-center justify-between gap-4 border-b border-[#E8E8ED] py-4 transition-colors hover:bg-[#FAFAFA]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="mt-1 size-2 shrink-0 self-start rounded-full bg-[#0071E3]" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium">{p.name}</p>
                    <p className="mt-0.5 truncate font-mono text-xs text-[#6E6E73]">
                      prj_{p.id} · {p.documents} docs · {p.chunks.toLocaleString()} chunks
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="hidden font-mono text-xs text-[#6E6E73] sm:block">
                    Updated {p.updated}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-xs text-[#6E6E73] opacity-0 transition-opacity group-hover:opacity-100">
                    Open <Plus className="size-3 rotate-45" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* totals */}
      <div className="mt-8 flex gap-8 border-t border-[#E8E8ED] pt-4">
        {[
          { label: "Total documents", value: totals.docs },
          { label: "Total chunks", value: totals.chunks },
        ].map((s) => (
          <div key={s.label}>
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#6E6E73]">{s.label}</p>
            <p className="mt-0.5 text-[20px] font-semibold tabular-nums tracking-tight">
              <AnimatedNumber value={s.value} />
            </p>
          </div>
        ))}
        <div className="ml-auto hidden items-center sm:flex">
          <Link href="/dashboard/documents" className="flex items-center gap-1 text-sm text-[#6E6E73] transition-colors hover:text-[#1D1D1F]">
            <Plus className="size-4" /> Upload documents
          </Link>
        </div>
      </div>
    </div>
  );
}
