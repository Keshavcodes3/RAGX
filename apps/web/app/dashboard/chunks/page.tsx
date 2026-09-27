"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { chunks, type Chunk } from "../../../components/dashboard/data";
import { EmptyState, PageHead } from "../../../components/dashboard/ui";

export default function ChunksPage() {
  const [selected, setSelected] = useState<Chunk | null>(null);
  const [flash, setFlash] = useState(false);

  return (
    <div>
      <PageHead title="Chunks" sub="The exact retrieval units your applications receive. Click a row to inspect." />

      {chunks.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No chunks yet."
            body="Chunks appear here once your first document finishes the pipeline."
            action={<span className="rounded-full bg-[#0071E3] px-4 py-2 text-sm font-medium text-white">Upload document</span>}
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-[#E8E8ED]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#E8E8ED] bg-[#F5F5F7]/60 font-mono text-[11px] uppercase tracking-wider text-[#6E6E73]">
                <th className="px-5 py-3 font-medium">Chunk ID</th>
                <th className="px-3 py-3 font-medium">Content</th>
                <th className="px-3 py-3 font-medium">Document</th>
                <th className="px-3 py-3 font-medium">Page</th>
                <th className="px-3 py-3 font-medium">Tokens</th>
                <th className="px-5 py-3 text-right font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {chunks.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`cursor-pointer border-b border-[#E8E8ED] last:border-0 transition-colors hover:bg-[#F5F5F7]/50 ${
                    selected?.id === c.id ? "bg-[#0071E3]/[0.04]" : ""
                  }`}
                >
                  <td className="px-5 py-3 font-mono text-xs text-[#0071E3]">{c.id}</td>
                  <td className="max-w-[280px] truncate px-3 py-3 text-[13px] text-[#6E6E73]">{c.content}</td>
                  <td className="px-3 py-3 font-mono text-xs">{c.document}</td>
                  <td className="px-3 py-3 font-mono text-xs tabular-nums">{c.page}</td>
                  <td className="px-3 py-3 font-mono text-xs tabular-nums">{c.tokens}</td>
                  <td className="px-5 py-3 text-right font-mono text-xs text-[#0071E3]">{(c.score ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* side panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-[60] bg-black/15"
            />
            <motion.aside
              initial={{ x: 360 }}
              animate={{ x: 0 }}
              exit={{ x: 360 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed bottom-0 right-0 top-0 z-[61] flex w-full max-w-sm flex-col border-l border-[#E8E8ED] bg-white"
            >
              <div className="flex items-center justify-between border-b border-[#E8E8ED] px-5 py-4">
                <p className="font-mono text-[13px] font-medium">{selected.id}</p>
                <button onClick={() => setSelected(null)} aria-label="Close panel" className="grid size-8 place-items-center rounded-lg transition-colors hover:bg-[#F5F5F7]">
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <p className="text-[16px] font-semibold">{selected.section}</p>
                <div className={`mt-3 rounded-xl border p-4 font-mono text-[13px] leading-relaxed transition-colors ${flash ? "border-[#0071E3] bg-[#0071E3]/[0.06]" : "border-[#E8E8ED] bg-[#F5F5F7]/60"}`}>
                  {selected.content}
                </div>
                <dl className="mt-5 space-y-0 divide-y divide-[#E8E8ED] border-y border-[#E8E8ED] text-sm">
                  {[
                    ["Document", selected.document],
                    ["Page", String(selected.page)],
                    ["Section", selected.section],
                    ["Token count", String(selected.tokens)],
                    ["Score", (selected.score ?? 0).toFixed(2)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-2.5">
                      <dt className="text-[#6E6E73]">{k}</dt>
                      <dd className="font-mono text-[13px]">{v}</dd>
                    </div>
                  ))}
                </dl>
                <button
                  onClick={() => {
                    setFlash(true);
                    setTimeout(() => setFlash(false), 1200);
                  }}
                  className="mt-4 w-full rounded-lg border border-[#0071E3]/30 bg-[#0071E3]/[0.06] py-2.5 text-sm font-medium text-[#0071E3] transition-colors hover:bg-[#0071E3]/10"
                >
                  {flash ? "Source highlighted ✓" : "View source"}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
