"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Ellipsis, RotateCw } from "lucide-react";
import { documents, tablePreview } from "../../../../components/dashboard/data";

const PIPELINE = ["Loaded", "Parsed", "Chunked", "Embedded", "Indexed"];

type Filter = "all" | "tables" | "headings" | "code";

export default function DocumentDetail() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "manual";
  const doc = documents.find((d) => d.id === id) ?? documents[0]!;
  const [filter, setFilter] = useState<Filter>("all");
  const rows = tablePreview[doc.id] ?? [];

  const stats = [
    { k: "Headings", v: doc.headings, f: "headings" as Filter },
    { k: "Paragraphs", v: doc.paragraphs, f: "all" as Filter },
    { k: "Tables", v: doc.tables, f: "tables" as Filter },
    { k: "Images", v: doc.images, f: "all" as Filter },
    { k: "Code blocks", v: doc.codeBlocks, f: "code" as Filter },
  ];

  return (
    <div>
      <Link href="/dashboard/documents" className="flex items-center gap-1.5 font-mono text-[13px] text-[#6E6E73] hover:text-[#1D1D1F]">
        <ArrowLeft className="size-3.5" /> Documents
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{doc.name}</h1>
          <p className="mt-1 font-mono text-[13px] text-[#6E6E73]">
            {doc.type} · {doc.pages} pages · {doc.chunks.toLocaleString()} chunks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-[#E8E8ED] px-3 py-2 text-[13px] font-medium transition-colors hover:border-[#1D1D1F]/25">
            <RotateCw className="size-3.5" /> Reprocess
          </button>
          <button aria-label="More actions" className="grid size-[34px] place-items-center rounded-lg border border-[#E8E8ED] transition-colors hover:border-[#1D1D1F]/25">
            <Ellipsis className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-7 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* preview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-[#E8E8ED]">
          <div className="border-b border-[#E8E8ED] bg-[#F5F5F7]/70 px-5 py-3 font-mono text-xs text-[#6E6E73]">
            Preview · page 12 {filter !== "all" ? `· filtered: ${filter}` : ""}
          </div>
          <div className="space-y-3 bg-white p-6">
            {(filter === "all" || filter === "headings") && (
              <p className="text-[17px] font-semibold">Authentication</p>
            )}
            {(filter === "all" || filter === "headings") && (
              <p className="text-[15px] font-medium text-[#1D1D1F]/80">Token lifecycle</p>
            )}
            {filter !== "tables" && filter !== "code" && (
              <p className="font-mono text-[13px] leading-relaxed text-[#6E6E73]">
                JWT tokens are issued on login and verified per request. Access tokens expire after 15 minutes…
              </p>
            )}
            {(filter === "all" || filter === "tables") && rows.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-[#0071E3]/25">
                <table className="w-full font-mono text-xs">
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className={i === 0 ? "bg-[#0071E3]/[0.06] font-semibold" : "border-t border-[#E8E8ED]"}>
                        {r.map((c, j) => (
                          <td key={j} className="px-3 py-2">{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {(filter === "all" || filter === "code") && (
              <pre className="overflow-x-auto rounded-lg bg-[#1D1D1F] p-4 font-mono text-xs leading-relaxed text-white/85">
                <code>{`Authorization: Bearer <token>\nContent-Type: application/json`}</code>
              </pre>
            )}
          </div>
        </motion.div>

        {/* pipeline + structure */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-2xl border border-[#E8E8ED] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#6E6E73]">Ingestion</p>
            <div className="mt-3 space-y-0">
              {PIPELINE.map((s, i) => (
                <div key={s} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.15 + i * 0.12 }}
                      className="grid size-5 place-items-center rounded-full bg-[#0071E3]"
                    >
                      <Check className="size-3 text-white" strokeWidth={3} />
                    </motion.span>
                    {i < PIPELINE.length - 1 && <span className="h-4 w-px bg-[#E8E8ED]" />}
                  </div>
                  <p className="pb-3 text-[14px]">{s}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="rounded-2xl border border-[#E8E8ED] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#6E6E73]">Document structure</p>
            <div className="mt-3 divide-y divide-[#E8E8ED]">
              {stats.map((s) => (
                <button
                  key={s.k}
                  onClick={() => setFilter(filter === s.f ? "all" : s.f)}
                  className={`flex w-full items-center justify-between py-2.5 text-left text-[14px] transition-colors ${
                    filter === s.f && s.f !== "all" ? "font-semibold text-[#0071E3]" : "hover:text-[#0071E3]"
                  }`}
                >
                  {s.k}
                  <span className="font-mono text-[13px] tabular-nums text-[#6E6E73]">{s.v.toLocaleString()}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 font-mono text-[11px] text-[#6E6E73]">Click Tables to filter the preview.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
