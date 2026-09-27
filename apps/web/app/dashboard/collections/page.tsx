"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronDown, Plus, Search } from "lucide-react";
import { collections as seed, documents } from "../../../components/dashboard/data";
import { EmptyState, PageHead } from "../../../components/dashboard/ui";

export default function CollectionsPage() {
  const [items, setItems] = useState(seed);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(seed[0]?.id ?? null);
  const [composing, setComposing] = useState(false);
  const [name, setName] = useState("");

  const filtered = useMemo(
    () => items.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );

  const create = () => {
    const clean = name.trim();
    if (!clean) return;
    const id = clean.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    setItems((list) => [{ id, name: clean, documents: 0, chunks: 0 }, ...list]);
    setOpenId(id);
    setName("");
    setComposing(false);
  };

  return (
    <div>
      <PageHead
        title="Collections"
        sub="Namespaces your applications retrieve from. Scope every query to a collection."
        right={
          <button
            onClick={() => setComposing((c) => !c)}
            className="rounded-md bg-[#1D1D1F] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black"
          >
            {composing ? "Close" : "New Collection"}
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
            placeholder="engineering-docs"
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

      <div className="mt-4 flex items-center gap-2 border-b border-[#E8E8ED] pb-2">
        <Search className="size-4 shrink-0 text-[#6E6E73]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search collections…"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#6E6E73]/50"
        />
        <span className="shrink-0 font-mono text-[11px] text-[#6E6E73]">
          {filtered.length}/{items.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No collections yet."
            body="Group documents into isolated knowledge bases your applications retrieve from."
            action={
              <button
                onClick={() => {
                  setComposing(true);
                  setName(q);
                }}
                className="rounded-md bg-[#1D1D1F] px-4 py-2 text-sm font-medium text-white"
              >
                New Collection
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-1">
          {filtered.map((c, i) => {
            const open = openId === c.id;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.04, 0.25) }}
                className="border-b border-[#E8E8ED]"
              >
                <button
                  onClick={() => setOpenId(open ? null : c.id)}
                  className={`flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:bg-[#FAFAFA] ${open ? "bg-[#FAFAFA]/60" : ""}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`size-2 shrink-0 rounded-full ${open ? "bg-[#0071E3]" : "bg-[#E8E8ED]"}`} aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium">{c.name}</p>
                      <p className="mt-0.5 truncate font-mono text-xs text-[#6E6E73]">
                        kb_{c.id} · {c.documents.toLocaleString()} docs · {c.chunks.toLocaleString()} chunks
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="hidden font-mono text-xs tabular-nums text-[#6E6E73] sm:block">
                      {c.chunks.toLocaleString()} vectors
                    </span>
                    <ChevronDown
                      className={`size-4 text-[#6E6E73] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-px border-t border-[#E8E8ED] bg-[#E8E8ED] sm:grid-cols-[1fr_1fr_1fr]">
                        {/* contained docs */}
                        <div className="bg-white px-5 py-4">
                          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#6E6E73]">Top documents</p>
                          <div className="mt-2.5 space-y-1.5">
                            {documents.slice(0, 3).map((d) => (
                              <Link
                                key={d.id}
                                href={`/dashboard/documents/${d.id}`}
                                className="group flex items-center justify-between font-mono text-xs"
                              >
                                <span className="truncate text-[#1D1D1F]">{d.name}</span>
                                <span className="shrink-0 tabular-nums text-[#6E6E73]">{d.chunks} ch</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                        {/* scope */}
                        <div className="bg-white px-5 py-4">
                          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#6E6E73]">Query scope</p>
                          <pre className="mt-2.5 overflow-x-auto rounded-md border border-[#E8E8ED] bg-[#F5F5F7] p-3 font-mono text-[11.5px] leading-relaxed text-[#1D1D1F]">
                            <code>
                              {`ragx.retrieve({\n  query,\n  knowledgeBase: `}
                              <span className="text-[#0071E3]">{`"kb_${c.id}"`}</span>
                              {`\n})`}
                            </code>
                          </pre>
                        </div>
                        {/* actions */}
                        <div className="flex flex-row items-center gap-2 bg-white px-5 py-4 sm:flex-col sm:items-stretch sm:justify-center">
                          {[
                            { label: "Open in Search", href: "/dashboard/search" },
                            { label: "Inspect chunks", href: "/dashboard/chunks" },
                            { label: "Manage docs", href: "/dashboard/documents" },
                          ].map((a) => (
                            <Link
                              key={a.label}
                              href={a.href}
                              className="flex flex-1 items-center justify-between rounded-md border border-[#E8E8ED] px-3 py-2 text-[13px] transition-colors hover:border-[#0071E3]/50 hover:text-[#0071E3]"
                            >
                              {a.label}
                              <ArrowUpRight className="size-3.5" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      <p className="mt-6 font-mono text-xs text-[#6E6E73]">
        Retrieval is always scoped: no collection, no context.
      </p>
    </div>
  );
}
