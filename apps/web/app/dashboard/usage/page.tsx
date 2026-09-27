"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { usageSeries } from "../../../components/dashboard/data";
import { AnimatedNumber, PageHead } from "../../../components/dashboard/ui";

const RANGES = ["24h", "7d", "30d", "90d"] as const;

function Chart({ values }: { values: number[] }) {
  const { path, area } = useMemo(() => {
    const w = 720;
    const h = 180;
    const pad = 8;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const span = Math.max(1, max - min);
    const pts = values.map((v, i) => {
      const x = pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / span) * (h - pad * 2);
      return [x, y] as const;
    });
    const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    return {
      path: line,
      area: `${line} L${(w - pad).toFixed(1)},${h} L${pad},${h} Z`,
    };
  }, [values]);
  const max = Math.max(...values);
  return (
    <div>
      <svg viewBox="0 0 720 180" className="w-full" role="img" aria-label="Retrievals over time">
        <defs>
          <linearGradient id="ragx-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0071E3" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0071E3" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="8" x2="712" y1={180 * f} y2={180 * f} stroke="#E8E8ED" strokeWidth="1" />
        ))}
        <motion.path d={area} fill="url(#ragx-area)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
        <motion.path
          d={path}
          fill="none"
          stroke="#0071E3"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="flex justify-between font-mono text-[11px] text-[#6E6E73]">
        <span>0</span>
        <span>{max.toLocaleString()} peak</span>
      </div>
    </div>
  );
}

export default function UsagePage() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("7d");
  const totals = [
    { label: "Retrievals", value: 12842 },
    { label: "Documents processed", value: 1284 },
    { label: "Chunks created", value: 48291 },
    { label: "Embedding requests", value: 48291 },
  ];
  return (
    <div>
      <PageHead title="Usage" sub="Retrievals, documents and embeddings across your workspace." />
      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#E8E8ED] bg-[#E8E8ED] lg:grid-cols-4">
        {totals.map((t) => (
          <div key={t.label} className="bg-white px-5 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#6E6E73]">{t.label}</p>
            <p className="mt-1.5 text-[24px] font-semibold tabular-nums tracking-tight">
              <AnimatedNumber value={t.value} />
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-[#E8E8ED] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[15px] font-medium">Retrievals</p>
          <div className="flex gap-1 rounded-lg bg-[#F5F5F7] p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1.5 font-mono text-xs transition-all ${
                  range === r ? "bg-white font-semibold shadow-[0_1px_4px_rgba(0,0,0,0.08)]" : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4" key={range}>
          <Chart values={usageSeries[range] ?? []} />
        </div>
      </div>
    </div>
  );
}
