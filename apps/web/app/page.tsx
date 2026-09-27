"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, Copy, FileText, Terminal } from "lucide-react";
import { LogoMark } from "../components/Logo";

const rise = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.07, ease: "easeOut" as const },
  }),
};

/* ---------------------------------- nav ---------------------------------- */

const LINKS = [
  { label: "Docs", href: "#code" },
  { label: "API", href: "#code" },
  { label: "GitHub", href: "#cta" },
  { label: "Pricing", href: "#cta" },
];

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 24);
    if (y <= 24) setOpen(false);
  });

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4"
    >
      <motion.div
        layout
        animate={{
          maxWidth: scrolled ? 680 : 1152,
          y: scrolled ? 12 : 0,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className={`pointer-events-auto w-full ${
          scrolled
            ? "rounded-full border border-[#E8E8ED] bg-white/85 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl"
            : "rounded-none border-b border-transparent bg-white/0"
        }`}
      >
      <div className={`mx-auto flex items-center justify-between ${scrolled ? "h-12 px-4" : "h-14 px-2 sm:px-4"}`}>
        <a href="#top" className="group flex items-center gap-2 text-[17px] font-semibold tracking-tight">
          <motion.span
            whileHover={{ rotate: -8, scale: 1.06 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="inline-flex"
          >
            <LogoMark size={24} />
          </motion.span>
          <span>RAGX</span>
          <span className="hidden rounded-full border border-[#E8E8ED] px-2 py-0.5 font-mono text-[10px] font-normal text-[#6E6E73] sm:block">
            v0.1
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex" onMouseLeave={() => setHovered(null)}>
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onMouseEnter={() => setHovered(l.label)}
              className="relative rounded-full px-3.5 py-1.5 text-sm text-[#6E6E73] transition-colors hover:text-[#1D1D1F]"
            >
              {hovered === l.label && (
                <motion.span
                  layoutId="nav-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-[#F5F5F7]"
                  aria-hidden
                />
              )}
              <span className="relative">{l.label}</span>
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <motion.a
            href="#cta"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group hidden items-center gap-1.5 rounded-full bg-[#0071E3] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0077ED] sm:flex"
          >
            Get Started
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </motion.a>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-9 place-items-center rounded-full border border-[#E8E8ED] bg-white md:hidden"
          >
            <span className="relative block h-3 w-4">
              <motion.span
                animate={open ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                className="absolute left-0 top-0 h-[1.5px] w-4 bg-[#1D1D1F]"
              />
              <motion.span
                animate={open ? { opacity: 0 } : { opacity: 1 }}
                className="absolute left-0 top-[5px] h-[1.5px] w-4 bg-[#1D1D1F]"
              />
              <motion.span
                animate={open ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                className="absolute left-0 top-[10px] h-[1.5px] w-4 bg-[#1D1D1F]"
              />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="overflow-hidden border-t border-[#E8E8ED] bg-white md:hidden rounded-b-[24px]"
          >
            <div className="space-y-1 px-6 py-4">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] transition-colors hover:bg-[#F5F5F7]"
                >
                  {l.label}
                  <ArrowRight className="size-4 text-[#6E6E73]" />
                </motion.a>
              ))}
              <motion.a
                href="#cta"
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-[#0071E3] px-4 py-2.5 text-sm font-medium text-white"
              >
                Get Started <ArrowRight className="size-4" />
              </motion.a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
      </motion.div>
    </motion.header>
  );
}

/* ---------------------------------- hero --------------------------------- */

function Hero() {
  const [copied, setCopied] = useState(false);
  const install = "bun add @ragx/sdk";
  return (
    <section id="top" className="relative overflow-hidden pt-36 pb-14">
      <div className="blueprint absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E8E8ED] bg-white px-3.5 py-1.5 text-[13px] text-[#6E6E73]">
            <span className="pulse-dot size-1.5 rounded-full bg-[#0071E3]" />
            RAG infrastructure for developers
            <span className="font-mono text-[#E8E8ED]">/</span>
            <span className="font-mono text-[#1D1D1F]">v0.1</span>
          </span>
        </motion.div>

        <motion.h1
          variants={rise}
          initial="hidden"
          animate="show"
          custom={1}
          className="mx-auto mt-7 max-w-4xl text-[44px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-7xl"
        >
          The <em className="font-serif font-medium italic tracking-[-0.02em]">retrieval</em> layer
          <br className="hidden sm:block" /> for your AI applications.
        </motion.h1>

        <motion.p
          variants={rise}
          initial="hidden"
          animate="show"
          custom={2}
          className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-[#6E6E73]"
        >
          Parse documents, create meaningful chunks, generate embeddings, and retrieve
          the right context — without rebuilding the RAG pipeline yourself.
        </motion.p>

        <motion.div
          variants={rise}
          initial="hidden"
          animate="show"
          custom={3}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a
            href="#cta"
            className="w-full rounded-full bg-[#0071E3] px-7 py-3 text-[15px] font-medium text-white transition-all hover:bg-[#0077ED] active:scale-[0.98] sm:w-auto"
          >
            Get Started
          </a>
          <a href="#code" className="group flex items-center gap-1 px-2 py-3 text-[15px] font-medium text-[#0071E3]">
            Read the Docs
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </motion.div>

        <motion.button
          variants={rise}
          initial="hidden"
          animate="show"
          custom={4}
          onClick={() => {
            void navigator.clipboard?.writeText(install).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
          className="group mx-auto mt-7 flex items-center gap-3 rounded-xl border border-[#E8E8ED] bg-white px-4 py-2.5 font-mono text-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:border-[#1D1D1F]/20"
        >
          <Terminal className="size-3.5 text-[#6E6E73]" />
          <span className="text-[#1D1D1F]">{install}</span>
          <span className="flex items-center gap-1 text-[#6E6E73]">
            <Copy className="size-3.5" /> {copied ? "copied" : "copy"}
          </span>
        </motion.button>

        {/* honest technical facts, not metrics */}
        <motion.div
          variants={rise}
          initial="hidden"
          animate="show"
          custom={5}
          className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-6 font-mono text-xs text-[#6E6E73]"
        >
          <span>6 pipeline stages</span>
          <span className="h-3 w-px bg-[#E8E8ED]" />
          <span>PDF · MD · DOCX · HTML · CSV</span>
          <span className="h-3 w-px bg-[#E8E8ED]" />
          <span>pgvector</span>
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------- pipeline ------------------------------- */

const PIPE = ["Documents", "Parsing", "Chunking", "Embeddings", "Retrieval", "Context"];

function PipelineStrip() {
  return (
    <section aria-label="RAGX pipeline" className="mx-auto max-w-6xl px-6 pb-20">
      <div className="relative rounded-2xl border border-[#E8E8ED] bg-white px-6 py-8 sm:px-10">
        <div className="flex flex-col gap-0 sm:flex-row sm:items-center">
          {PIPE.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col sm:items-center">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.4 }}
                className="flex items-center gap-3 sm:flex-col sm:gap-2.5 sm:text-center"
              >
                <span
                  className={`grid size-7 place-items-center rounded-full border font-mono text-[11px] ${
                    s === "Context"
                      ? "border-[#0071E3] bg-[#0071E3] text-white"
                      : "border-[#E8E8ED] bg-white text-[#1D1D1F]"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={`font-mono text-[13px] ${s === "Context" ? "font-semibold text-[#0071E3]" : ""}`}>
                  {s}
                </span>
              </motion.div>
              {i < PIPE.length - 1 && (
                <>
                  <span className="ml-3.5 h-5 w-px bg-[#E8E8ED] sm:hidden" aria-hidden />
                  <div className="relative mx-2 hidden h-px flex-1 bg-[#E8E8ED] sm:block" aria-hidden>
                    <motion.span
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.15 + i * 0.12, duration: 0.5, ease: "easeOut" }}
                      className="absolute inset-0 origin-left bg-[#0071E3]"
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ product visual ---------------------------- */

const DOCS = ["manual.pdf", "documentation.pdf", "api-reference.md"];
const STAGES = ["Parsing", "Chunking", "Embedding", "Indexing"];

function ProductVisual() {
  const [active, setActive] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % 3), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <motion.div
        variants={rise}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        custom={0}
        className="overflow-hidden rounded-2xl border border-[#E8E8ED]"
      >
        <div className="flex items-center justify-between border-b border-[#E8E8ED] bg-[#F5F5F7] px-5 py-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#E8E8ED]" />
            <span className="size-2.5 rounded-full bg-[#E8E8ED]" />
            <span className="size-2.5 rounded-full bg-[#E8E8ED]" />
            <span className="ml-3 font-mono text-xs text-[#6E6E73]">ragx — pipeline</span>
          </div>
          <div className="flex gap-1.5">
            {["Documents", "Pipeline", "Context"].map((t, i) => (
              <button
                key={t}
                onClick={() => setActive(i)}
                className={`rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors ${
                  active === i ? "bg-[#1D1D1F] text-white" : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3">
          <button
            onClick={() => setActive(0)}
            className={`p-6 text-left transition-colors md:border-r md:border-[#E8E8ED] ${
              active === 0 ? "bg-[#0071E3]/[0.04]" : "bg-white"
            }`}
          >
            <p className="font-mono text-xs uppercase tracking-wider text-[#6E6E73]">Documents</p>
            <div className="mt-4 space-y-2.5">
              {DOCS.map((f, i) => (
                <motion.div
                  key={f}
                  initial={{ opacity: 0.35 }}
                  animate={{ opacity: active === 0 || active === 1 ? 1 : 0.45 }}
                  transition={{ delay: active === 0 ? i * 0.15 : 0 }}
                  className="flex items-center gap-2.5 rounded-lg border border-[#E8E8ED] bg-white px-3 py-2.5 font-mono text-[13px]"
                >
                  <FileText className="size-3.5 shrink-0 text-[#6E6E73]" />
                  {f}
                </motion.div>
              ))}
            </div>
          </button>

          <button
            onClick={() => setActive(1)}
            className={`border-t border-[#E8E8ED] p-6 text-left transition-colors md:border-t-0 md:border-r ${
              active === 1 ? "bg-[#0071E3]/[0.04]" : "bg-white"
            }`}
          >
            <p className="font-mono text-xs uppercase tracking-wider text-[#6E6E73]">RAGX Pipeline</p>
            <div className="mt-4 space-y-2.5">
              {STAGES.map((s, i) => (
                <div key={s} className="flex items-center justify-between rounded-lg border border-[#E8E8ED] bg-white px-3 py-2.5 text-[14px]">
                  <span>{s}</span>
                  <motion.span
                    initial={false}
                    animate={
                      active >= 1
                        ? { opacity: 1, scale: 1, backgroundColor: "#0071E3", borderColor: "#0071E3" }
                        : { opacity: 0.4, scale: 0.9, backgroundColor: "#fff", borderColor: "#E8E8ED" }
                    }
                    transition={{ delay: active === 1 ? 0.3 + i * 0.28 : 0, type: "spring", stiffness: 400, damping: 22 }}
                    className="grid size-5 place-items-center rounded-full border"
                  >
                    <Check className="size-3 text-white" strokeWidth={3} />
                  </motion.span>
                </div>
              ))}
            </div>
          </button>

          <button
            onClick={() => setActive(2)}
            className={`border-t border-[#E8E8ED] bg-[#F5F5F7]/70 p-6 text-left transition-colors md:border-t-0 ${
              active === 2 ? "bg-[#0071E3]/[0.06]" : ""
            }`}
          >
            <p className="font-mono text-xs uppercase tracking-wider text-[#6E6E73]">Retrieved Context</p>
            <div className="mt-4 rounded-lg border border-[#E8E8ED] bg-white p-4">
              <p className="text-[14px] font-medium">Authentication</p>
              <p className="mt-1.5 font-mono text-[13px] leading-relaxed text-[#6E6E73]">
                JWT tokens are issued on login and verified per request…
              </p>
              <div className="mt-3 flex items-center justify-between font-mono text-xs">
                <span className="text-[#0071E3]">score 0.94 · page 12</span>
                <span className="text-[#6E6E73]">chunk 042</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#E8E8ED]">
                <motion.div
                  initial={false}
                  animate={{ width: active === 2 ? "94%" : "12%" }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="h-full rounded-full bg-[#0071E3]"
                />
              </div>
            </div>
          </button>
        </div>
      </motion.div>
      <p className="mt-3 text-center font-mono text-xs text-[#6E6E73]">
        Live schematic — pipeline state cycles automatically. Click a pane to inspect it.
      </p>
    </section>
  );
}

/* -------------------------------- boring part ----------------------------- */

const WITHOUT = ["Loader", "Parser", "Chunker", "Embedding provider", "Vector database", "Retrieval logic", "Metadata"];

function BoringPart() {
  return (
    <section className="border-t border-[#E8E8ED] bg-[#F5F5F7]">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }} custom={0} className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] sm:text-[40px] sm:leading-[1.1]">
            Stop rebuilding the boring part of RAG.
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#6E6E73]">
            Every AI application eventually needs to ingest documents, parse them, split them
            into useful chunks, generate embeddings, store vectors, and retrieve relevant context.
          </p>
        </motion.div>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1} className="rounded-2xl border border-[#E8E8ED] bg-white p-8">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-wider text-[#6E6E73]">Without RAGX</p>
              <span className="rounded-full bg-[#F5F5F7] px-2.5 py-1 font-mono text-[11px] text-[#6E6E73]">7 systems</span>
            </div>
            <div className="mt-6">
              {WITHOUT.map((s, i) => (
                <div key={s}>
                  <p className="font-mono text-[14px] text-[#6E6E73]">{s}</p>
                  {i < WITHOUT.length - 1 && <span className="my-1.5 ml-4 block h-3.5 w-px bg-[#E8E8ED]" aria-hidden />}
                </div>
              ))}
            </div>
            <p className="mt-6 border-t border-[#E8E8ED] pt-4 text-sm text-[#6E6E73]">You maintain everything.</p>
          </motion.div>
          <motion.div
            variants={rise}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={2}
            className="rounded-2xl border-2 border-[#0071E3]/30 bg-white p-8"
          >
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-wider text-[#0071E3]">With RAGX</p>
              <span className="rounded-full bg-[#0071E3]/10 px-2.5 py-1 font-mono text-[11px] text-[#0071E3]">1 API</span>
            </div>
            <div className="mt-6 flex min-h-[248px] flex-col items-start justify-center">
              <span className="font-mono text-[15px]">Documents</span>
              <svg width="2" height="28" className="ml-6"><line x1="1" y1="0" x2="1" y2="28" stroke="#0071E3" strokeWidth="2" className="flow-line" /></svg>
              <span className="rounded-lg bg-[#0071E3] px-4 py-2 font-mono text-[15px] font-semibold text-white">RAGX</span>
              <svg width="2" height="28" className="ml-6"><line x1="1" y1="0" x2="1" y2="28" stroke="#0071E3" strokeWidth="2" className="flow-line" /></svg>
              <span className="font-mono text-[15px]">Relevant context</span>
            </div>
            <p className="mt-6 border-t border-[#E8E8ED] pt-4 text-sm text-[#1D1D1F]">The pipeline is handled.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- how it works ---------------------------- */

const STEPS = [
  { n: "01", title: "Load", desc: "Bring PDFs, documents, markdown, and other supported sources into RAGX." },
  { n: "02", title: "Parse", desc: "Turn messy documents into structured content." },
  { n: "03", title: "Chunk", desc: "Split content into meaningful retrieval units." },
  { n: "04", title: "Embed", desc: "Generate vector representations using the provider you choose." },
  { n: "05", title: "Retrieve", desc: "Search your knowledge base using semantic retrieval." },
  { n: "06", title: "Build", desc: "Send the retrieved context to whatever LLM your application uses." },
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }} custom={0} className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-3xl font-semibold tracking-[-0.02em] sm:text-[40px]">One pipeline. Your stack.</h2>
        <p className="font-mono text-[13px] text-[#6E6E73]">src / pipeline.ts</p>
      </motion.div>
      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[#E8E8ED] bg-[#E8E8ED] sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            variants={rise}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={i}
            className="group bg-white p-7 transition-colors hover:bg-[#F5F5F7]"
          >
            <div className="flex items-center justify-between">
              <p className="font-mono text-[13px] text-[#0071E3]">{s.n}</p>
              <ArrowUpRight className="size-4 text-[#E8E8ED] transition-all group-hover:translate-x-0.5 group-hover:text-[#0071E3]" />
            </div>
            <h3 className="mt-3 text-[17px] font-semibold">{s.title}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-[#6E6E73]">{s.desc}</p>
          </motion.div>
        ))}
      </div>
      <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }} custom={0} className="mt-4 rounded-2xl border border-[#E8E8ED] p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-sm text-[15px] leading-relaxed text-[#6E6E73]">
            RAGX does not lock developers into an LLM. Retrieval out, generation wherever you want.
          </p>
          <div className="font-mono text-[14px]">
            <p className="font-semibold">RAGX</p>
            <div className="ml-1 mt-2 space-y-1.5 border-l-2 border-[#0071E3]/25 pl-5">
              {["OpenAI", "Anthropic", "Gemini", "Mistral", "Your own model"].map((p) => (
                <p key={p}><span className="mr-2 text-[#E8E8ED]">├──</span>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ------------------------------- dev experience --------------------------- */

type Tab = "ingest" | "retrieve";

const SNIPPETS: Record<Tab, string[]> = {
  ingest: ['const result = await ragx.documents.ingest(', '  "./manual.pdf"', ');'],
  retrieve: ['const context = await ragx.retrieve({', '  query: "How does authentication work?"', '});'],
};

function DevExperience() {
  const [tab, setTab] = useState<Tab>("ingest");
  const [copied, setCopied] = useState(false);
  const code = SNIPPETS[tab]?.join("\n") ?? "";
  return (
    <section id="code" className="bg-[#0A0A0C] py-24 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }} custom={0} className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Developer experience</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] sm:text-[40px]">From document to context in a few lines.</h2>
        </motion.div>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="flex gap-1.5">
                {(["ingest", "retrieve"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
                      tab === t ? "bg-white text-black" : "text-white/50 hover:text-white"
                    }`}
                  >
                    {t}.ts
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  void navigator.clipboard?.writeText(code).catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1400);
                }}
                className="flex items-center gap-1.5 font-mono text-xs text-white/40 transition-colors hover:text-white"
              >
                <Copy className="size-3.5" /> {copied ? "copied" : "copy"}
              </button>
            </div>
            <pre className="code-scroll-dark overflow-x-auto p-6 font-mono text-[13.5px] leading-[1.8]">
              <code>
                {code.split("\n").map((line, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="w-4 shrink-0 select-none text-right text-white/20">{i + 1}</span>
                    <span className={line.includes('"') ? "text-white/90" : "text-white/75"}>
                      {line.includes('"') ? (
                        <>
                          {line.split('"')[0]}"<span className="text-[#4aa3ff]">{line.split('"')[1]}</span>"{line.split('"')[2]}
                        </>
                      ) : (
                        line
                      )}
                    </span>
                  </div>
                ))}
                <span className="ml-8 mt-1 inline-block h-4 w-[7px] animate-pulse bg-[#0071E3]" />
              </code>
            </pre>
          </motion.div>
          <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }} custom={2} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 px-5 py-3 font-mono text-xs text-white/40">response.json</div>
            <pre className="code-scroll-dark overflow-x-auto p-6 font-mono text-[13.5px] leading-[1.8] text-white/75">
              <code>
                {"{\n"}
                {'  chunks: [\n'}
                {"    {\n"}
                {'      content: '}<span className="text-[#4aa3ff]">"..."</span>{",\n"}
                {"      score: "}<span className="text-[#4aa3ff]">0.94</span>{",\n"}
                {"      metadata: {\n"}
                {"        page: "}<span className="text-[#4aa3ff]">12</span>{",\n"}
                {'        section: '}<span className="text-[#4aa3ff]">"Authentication"</span>{"\n"}
                {"      }\n"}
                {"    }\n"}
                {"  ]\n"}
                {"}"}
              </code>
            </pre>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- doc understanding -------------------------- */

function DocUnderstanding() {
  const blocks = ["Heading", "Paragraph", "Table", "Image", "Code"];
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }} custom={0} className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-[-0.02em] sm:text-[40px]">Documents aren&apos;t just text.</h2>
        <p className="mt-4 text-[17px] leading-relaxed text-[#6E6E73]">
          Real-world documents are messy. RAGX decomposes them into structured elements before they ever become chunks.
        </p>
      </motion.div>
      <div className="mt-10 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1} className="rounded-2xl border border-[#E8E8ED] p-7">
          <p className="font-mono text-xs uppercase tracking-wider text-[#6E6E73]">Input</p>
          <div className="mt-4 space-y-2">
            {["Text", "Tables", "Images", "Code", "Headings", "Lists", "Scanned pages"].map((t) => (
              <span key={t} className="mr-2 inline-block rounded-full bg-[#F5F5F7] px-3 py-1.5 text-[13px]">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2.5 rounded-lg border border-[#E8E8ED] px-3 py-2.5 font-mono text-[13px]">
            <FileText className="size-4 text-[#0071E3]" /> report.pdf
          </div>
        </motion.div>
        <div className="hidden items-center font-mono text-[#E8E8ED] lg:flex">→</div>
        <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }} custom={2} className="rounded-2xl border border-[#E8E8ED] bg-[#F5F5F7]/60 p-7 font-mono text-[14px]">
          <p className="text-xs uppercase tracking-wider text-[#6E6E73]">Structured</p>
          <div className="mt-4 space-y-1.5">
            {blocks.map((b, i) => (
              <motion.p
                key={b}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.12 }}
                className="flex items-center gap-2 rounded-md border border-[#E8E8ED] bg-white px-3 py-1.5"
              >
                <span className="size-1.5 rounded-full bg-[#0071E3]" /> {b}
              </motion.p>
            ))}
          </div>
        </motion.div>
        <div className="hidden items-center font-mono text-[#E8E8ED] lg:flex">→</div>
        <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }} custom={3} className="rounded-2xl bg-[#1D1D1F] p-7 text-white">
          <p className="font-mono text-xs uppercase tracking-wider text-white/40">Chunks</p>
          {[0.94, 0.89, 0.81].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.14 }}
              className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3.5"
            >
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-white/40">chunk 0{i + 42}</span>
                <span className="text-[#4aa3ff]">{s.toFixed(2)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: "8%" }}
                  whileInView={{ width: `${s * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.14, duration: 0.7, ease: "easeOut" }}
                  className="h-full rounded-full bg-[#0071E3]"
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------- byok ---------------------------------- */

function Byok() {
  return (
    <section className="border-t border-[#E8E8ED] bg-[#F5F5F7]">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }} custom={0} className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] sm:text-[40px]">Bring your own model provider.</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#6E6E73]">
            Your data pipeline shouldn&apos;t dictate which AI provider you use.
          </p>
        </motion.div>
        <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { p: "OpenAI", k: "sk-…9f2a" },
            { p: "Mistral", k: "ms-…41bd" },
            { p: "Gemini", k: "AI…77e0" },
            { p: "Custom", k: "https://…" },
          ].map((c, i) => (
            <motion.div
              key={c.p}
              variants={rise}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              whileHover={{ y: -3 }}
              className="rounded-2xl border border-[#E8E8ED] bg-white p-6 transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
            >
              <p className="text-[15px] font-semibold">{c.p}</p>
              <p className="mt-2 font-mono text-xs text-[#6E6E73]">{c.k}</p>
            </motion.div>
          ))}
        </div>
        <p className="mt-6 font-mono text-[13px] text-[#1D1D1F]">Your keys. Your providers. Your control.</p>
      </div>
    </section>
  );
}

/* ------------------------------- built for devs ---------------------------- */

function BuiltForDevs() {
  const cols = [
    { title: "Provider agnostic", desc: "Use the embedding provider that fits your application." },
    { title: "Retrieval focused", desc: "RAGX handles the knowledge layer instead of becoming another chatbot." },
    { title: "Structured context", desc: "Retrieve useful chunks with metadata, scores, and document information." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid gap-x-10 gap-y-8 md:grid-cols-3">
        {cols.map((c, i) => (
          <motion.div
            key={c.title}
            variants={rise}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={i}
            className="border-t-2 border-[#1D1D1F] pt-6"
          >
            <h3 className="text-[17px] font-semibold">{c.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[#6E6E73]">{c.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- final cta ------------------------------- */

function FinalCta() {
  return (
    <section id="cta" className="border-t border-[#E8E8ED]">
      <div className="relative mx-auto max-w-6xl overflow-hidden px-6 py-28 text-center">
        <div className="blueprint absolute inset-0" aria-hidden />
        <motion.h2
          variants={rise}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          custom={0}
          className="relative mx-auto max-w-2xl text-4xl font-semibold tracking-[-0.02em] sm:text-6xl sm:leading-[1.05]"
        >
          Build the application. Let RAGX handle the retrieval.
        </motion.h2>
        <motion.p
          variants={rise}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          custom={1}
          className="relative mx-auto mt-5 max-w-xl text-[17px] text-[#6E6E73]"
        >
          Your AI application is the product. RAG infrastructure shouldn&apos;t be.
        </motion.p>
        <motion.div
          variants={rise}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          custom={2}
          className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a href="#top" className="rounded-full bg-[#0071E3] px-8 py-3 text-[15px] font-medium text-white transition-all hover:bg-[#0077ED] active:scale-[0.98]">
            Get Started
          </a>
          <a href="#code" className="px-2 py-3 text-[15px] font-medium text-[#0071E3]">
            Read the Docs
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#E8E8ED]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2">
              <LogoMark size={22} />
              <span className="text-[17px] font-semibold tracking-[-0.02em]">RAGX</span>
            </span>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#6E6E73]">
              Retrieval infrastructure for AI applications.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[#6E6E73]">Product</p>
            <div className="mt-4 space-y-2.5 text-sm">
              {["Docs", "API", "Pricing"].map((l) => (
                <a key={l} href="#" className="block transition-colors hover:text-[#0071E3]">{l}</a>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[#6E6E73]">Resources</p>
            <div className="mt-4 space-y-2.5 text-sm">
              {["GitHub", "Changelog", "Blog"].map((l) => (
                <a key={l} href="#" className="block transition-colors hover:text-[#0071E3]">{l}</a>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-12 border-t border-[#E8E8ED] pt-6 font-mono text-xs text-[#6E6E73]">
          RAGX — documents → parsing → chunking → embeddings → retrieval → context.
        </p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans text-[#1D1D1F] antialiased">
      <Nav />
      <Hero />
      <PipelineStrip />
      <ProductVisual />
      <BoringPart />
      <HowItWorks />
      <DevExperience />
      <DocUnderstanding />
      <Byok />
      <BuiltForDevs />
      <FinalCta />
      <Footer />
    </main>
  );
}
