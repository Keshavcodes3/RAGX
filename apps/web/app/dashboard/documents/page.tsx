"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, FileUp, Loader2, Plus } from "lucide-react";
import { documents } from "../../../components/dashboard/data";
import { EmptyState, PageHead, StatusDot } from "../../../components/dashboard/ui";

const STAGES = ["Parsing", "Chunking", "Embedding"];

export default function DocumentsPage() {
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const timers = useRef<number[]>([]);

  const startUpload = (name: string) => {
    setUploading(name);
    setStage(0);
    timers.current.forEach(clearTimeout);
    timers.current = STAGES.map((_, i) =>
      window.setTimeout(() => setStage(i + 1), 900 * (i + 1)),
    );
    timers.current.push(window.setTimeout(() => setUploading(null), 900 * (STAGES.length + 1)));
  };

  return (
    <div>
      <PageHead
        title="Documents"
        sub="Everything you've given RAGX to understand."
        right={
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1D1D1F] px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black">
            <Plus className="size-4" /> Upload documents
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]?.name;
                if (f) startUpload(f);
              }}
            />
          </label>
        }
      />

      {/* dropzone */}
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0]?.name;
          startUpload(f ?? "upload.pdf");
        }}
        animate={{ borderColor: drag ? "#0071E3" : "#E8E8ED", backgroundColor: drag ? "rgba(0,113,227,0.04)" : "#fff" }}
        className="mt-6 flex items-center justify-between rounded-2xl border border-dashed px-6 py-5 transition-colors"
      >
        <span className="flex items-center gap-3 text-sm text-[#6E6E73]">
          <FileUp className="size-5" />
          {drag ? "Drop to start the pipeline…" : "Drag & drop files here, or browse"}
        </span>
        <span className="hidden font-mono text-xs text-[#6E6E73] sm:block">PDF · DOCX · TXT · MD · HTML</span>
      </motion.div>

      {/* uploading pipeline */}
      {uploading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl border border-[#0071E3]/25 bg-[#0071E3]/[0.04] px-6 py-4"
        >
          <p className="font-mono text-[13px] font-medium">{uploading}</p>
          <div className="mt-3 flex items-center gap-2">
            {STAGES.map((s, i) => {
              const done = stage > i;
              const live = stage === i;
              return (
                <div key={s} className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] ${
                      done
                        ? "border-[#0071E3]/30 bg-white text-[#0071E3]"
                        : live
                          ? "border-[#0071E3] bg-[#0071E3] text-white"
                          : "border-[#E8E8ED] bg-white text-[#6E6E73]"
                    }`}
                  >
                    {done ? <Check className="size-3" /> : live ? <Loader2 className="size-3 animate-spin" /> : <span className="size-1.5 rounded-full bg-current opacity-40" />}
                    {s}
                  </span>
                  {i < STAGES.length - 1 && <span className="h-px w-4 bg-[#E8E8ED]" />}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {documents.length === 0 && !uploading ? (
        <div className="mt-6">
          <EmptyState
            title="No documents yet."
            body="Upload your first document and RAGX will take care of the pipeline."
            action={<span className="rounded-full bg-[#0071E3] px-4 py-2 text-sm font-medium text-white">Upload document</span>}
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-[#E8E8ED]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#E8E8ED] bg-[#F5F5F7]/60 font-mono text-[11px] uppercase tracking-wider text-[#6E6E73]">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Chunks</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d, i) => (
                <motion.tr
                  key={d.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-[#E8E8ED] last:border-0 transition-colors hover:bg-[#F5F5F7]/50"
                >
                  <td className="px-5 py-3.5">
                    <Link href={`/dashboard/documents/${d.id}`} className="font-medium hover:text-[#0071E3]">
                      {d.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3.5 font-mono text-xs text-[#6E6E73]">{d.type}</td>
                  <td className="px-3 py-3.5 font-mono text-xs tabular-nums">{d.chunks.toLocaleString()}</td>
                  <td className="px-3 py-3.5">
                    <span className="flex items-center gap-2 text-[13px]">
                      <StatusDot status={d.status} />
                      {d.status === "ready" ? "Ready" : d.status === "processing" ? `Processing · ${d.stage ?? "parsing"}` : "Failed"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs text-[#6E6E73]">{d.updated}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
