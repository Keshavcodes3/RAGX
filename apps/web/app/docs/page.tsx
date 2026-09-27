"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, ChevronDown, Copy, Search } from "lucide-react";
import { LogoMark } from "../../components/Logo";

const SECTIONS = [
  { id: "start", label: "Quickstart" },
  { id: "process", label: "What it does" },
  { id: "parsing", label: "How parsing works" },
  { id: "versus", label: "Traditional vs RAGX" },
  { id: "safety", label: "Process safety" },
  { id: "concepts", label: "Core concepts" },
  { id: "api", label: "API reference" },
  { id: "sdk", label: "SDK & BYOK" },
] as const;

interface Route {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  desc: string;
  auth: "cookie" | "key";
  req: string;
  res: string;
}

const BASE = "http://localhost:3000/api/v1";

const ROUTES: Route[] = [
  { method: "POST", path: "/auth/register", desc: "Create account", auth: "cookie",
    req: `curl -X POST ${BASE}/auth/register \\\n  -H "Content-Type: application/json" \\\n  -d '{"username":"keshav","email":"you@dev.io","password":"••••••••"}'`,
    res: `{\n  "id": "usr_9f2a",\n  "username": "keshav",\n  "email": "you@dev.io"\n}` },
  { method: "POST", path: "/auth/login", desc: "Sets httpOnly session cookie", auth: "cookie",
    req: `curl -X POST ${BASE}/auth/login -c cookies.txt \\\n  -H "Content-Type: application/json" \\\n  -d '{"email":"you@dev.io","password":"••••••••"}'`,
    res: `{\n  "id": "usr_9f2a",\n  "username": "keshav"\n}` },
  { method: "GET", path: "/auth/me", desc: "Current user", auth: "cookie",
    req: `curl ${BASE}/auth/me -b cookies.txt`,
    res: `{\n  "id": "usr_9f2a",\n  "email": "you@dev.io"\n}` },
  { method: "POST", path: "/auth/logout", desc: "Clear session", auth: "cookie",
    req: `curl -X POST ${BASE}/auth/logout -b cookies.txt`,
    res: `{\n  "success": true\n}` },
  { method: "POST", path: "/projects", desc: "Create + Default key", auth: "key",
    req: `curl -X POST ${BASE}/projects \\\n  -H "Authorization: Bearer ragx_live_•••" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Docs Assistant"}'`,
    res: `{\n  "project": { "id": "prj_8f92", "name": "Docs Assistant" },\n  "apiKey": { "key": "ragx_live_•••", "note": "shown once" }\n}` },
  { method: "GET", path: "/projects", desc: "List your projects", auth: "key",
    req: `curl ${BASE}/projects \\\n  -H "Authorization: Bearer ragx_live_•••"`,
    res: `[\n  { "id": "prj_8f92", "name": "Docs Assistant" }\n]` },
  { method: "GET", path: "/projects/:projectId", desc: "One project", auth: "key",
    req: `curl ${BASE}/projects/prj_8f92 \\\n  -H "Authorization: Bearer ragx_live_•••"`,
    res: `{\n  "id": "prj_8f92",\n  "name": "Docs Assistant",\n  "documents": 482\n}` },
  { method: "PATCH", path: "/projects/:projectId", desc: "Rename / describe", auth: "key",
    req: `curl -X PATCH ${BASE}/projects/prj_8f92 \\\n  -H "Authorization: Bearer ragx_live_•••" \\\n  -H "Content-Type: application/json" \\\n  -d '{"description":"Support knowledge"}'`,
    res: `{\n  "id": "prj_8f92",\n  "description": "Support knowledge"\n}` },
  { method: "DELETE", path: "/projects/:projectId", desc: "Delete + cascade", auth: "key",
    req: `curl -X DELETE ${BASE}/projects/prj_8f92 \\\n  -H "Authorization: Bearer ragx_live_•••"`,
    res: `{\n  "success": true\n}` },
  { method: "POST", path: "/projects/:projectId/api-keys", desc: "Mint a key (shown once)", auth: "key",
    req: `curl -X POST ${BASE}/projects/prj_8f92/api-keys \\\n  -H "Authorization: Bearer ragx_live_•••" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"ios-app"}'`,
    res: `{\n  "id": "key_41bd",\n  "key": "rgx_live_•••",\n  "note": "copy now — never shown again"\n}` },
  { method: "GET", path: "/projects/:projectId/api-keys", desc: "List key previews", auth: "key",
    req: `curl ${BASE}/projects/prj_8f92/api-keys \\\n  -H "Authorization: Bearer ragx_live_•••"`,
    res: `[\n  { "id": "key_41bd", "preview": "rgx_live_••••••", "name": "ios-app" }\n]` },
  { method: "DELETE", path: "/projects/:projectId/api-keys/:apiKeyId", desc: "Revoke (soft)", auth: "key",
    req: `curl -X DELETE ${BASE}/projects/prj_8f92/api-keys/key_41bd \\\n  -H "Authorization: Bearer ragx_live_•••"`,
    res: `{\n  "id": "key_41bd",\n  "revokedAt": "2026-09-25T…"\n}` },
];

function Code({ code, title, light = false, wrap = true }: { code: string; title?: string; light?: boolean; wrap?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={`group overflow-hidden rounded-xl border ${light ? "border-[#E8E8ED] bg-[#F5F5F7]" : "border-[#E8E8ED] bg-[#1D1D1F]"}`}>
      <div className={`flex items-center justify-between border-b px-4 py-2 ${light ? "border-[#E8E8ED]" : "border-white/10"}`}>
        <span className={`font-mono text-xs ${light ? "text-[#6E6E73]" : "text-white/40"}`}>{title ?? "code"}</span>
        <button
          onClick={() => {
            void navigator.clipboard?.writeText(code).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
          className={`flex items-center gap-1 font-mono text-xs transition-colors ${light ? "text-[#6E6E73] hover:text-[#1D1D1F]" : "text-white/40 hover:text-white"}`}
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className={`p-5 font-mono text-[12.5px] leading-[1.75] ${wrap ? "whitespace-pre-wrap break-words" : "overflow-x-auto"} ${light ? "text-[#1D1D1F]" : "text-white/85"}`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

const METHOD_COLOR: Record<Route["method"], string> = {
  GET: "text-[#0071E3]",
  POST: "text-emerald-600",
  PATCH: "text-amber-600",
  DELETE: "text-red-600",
};

const STAGE_DETAIL: { n: string; title: string; lines: string[] }[] = [
  { n: "01", title: "Load", lines: ["Accepts PDF, DOCX, TXT, MD, HTML, CSV — rejected otherwise, loudly.", "File is read once into memory; nothing is written to disk unprocessed."] },
  { n: "02", title: "Parse", lines: ["Format-specific loader recovers headings, paragraphs, tables, images, code.", "Output is one uniform structure — downstream stages never care about file type."] },
  { n: "03", title: "Chunk", lines: ["Recursive splitting with overlap; tables are atomic and never cut.", "Each chunk inherits its header path and page number as context."] },
  { n: "04", title: "Embed", lines: ["Hosted 384-dim vectors. Identical text is hash-cached — embedded once.", "Model name and dimensions are stored per chunk for future migration."] },
  { n: "05", title: "Retrieve", lines: ["Query is embedded with the same model; pgvector returns top-K by similarity.", "Min-score filtering and optional cross-encoder rerank before responding."] },
  { n: "06", title: "Context", lines: ["Chunks ship with text, score, document id, page and section.", "Your LLM turns them into answers — RAGX never generates."] },
];

function PipelineDeepDive() {
  const [open, setOpen] = useState<string | null>("03");
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-[#E8E8ED]">
      {STAGE_DETAIL.map((s, i) => {
        const isOpen = open === s.n;
        return (
          <div key={s.n} className={i > 0 ? "border-t border-[#E8E8ED]" : ""}>
            <button
              onClick={() => setOpen(isOpen ? null : s.n)}
              className={`flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors ${isOpen ? "bg-[#F5F5F7]/70" : "hover:bg-[#FAFAFA]"}`}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`grid size-7 shrink-0 place-items-center rounded-full border font-mono text-[11px] font-semibold ${isOpen ? "border-[#0071E3] bg-[#0071E3] text-white" : "border-[#E8E8ED] text-[#1D1D1F]"}`}
              >
                {s.n}
              </motion.span>
              <span className="flex-1 text-[15px] font-semibold">{s.title}</span>
              <ChevronDown className={`size-4 shrink-0 text-[#6E6E73] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <ul className="space-y-2 border-t border-[#E8E8ED] bg-white px-5 py-4 pl-[60px]">
                    {s.lines.map((l) => (
                      <li key={l} className="flex gap-2.5 text-[14px] leading-relaxed text-[#6E6E73]">
                        <span className="mt-[8px] size-1 shrink-0 rounded-full bg-[#0071E3]" aria-hidden />
                        {l}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function Explorer({ routes }: { routes: Route[] }) {
  const [open, setOpen] = useState<string | null>(ROUTES[0]?.path ?? null);
  return (
    <div className="overflow-hidden rounded-xl border border-[#E8E8ED]">
      {routes.map((r, i) => {
        const isOpen = open === r.path;
        return (
          <div key={r.path} className={i > 0 ? "border-t border-[#E8E8ED]" : ""}>
            <button
              onClick={() => setOpen(isOpen ? null : r.path)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${isOpen ? "bg-[#F5F5F7]/70" : "hover:bg-[#FAFAFA]"}`}
            >
              <span className={`w-14 shrink-0 font-mono text-[12px] font-semibold ${METHOD_COLOR[r.method]}`}>
                {r.method}
              </span>
              <code className="min-w-0 flex-1 truncate font-mono text-[13px]">{r.path}</code>
              <span className="hidden shrink-0 rounded-full bg-[#F5F5F7] px-2 py-0.5 font-mono text-[10.5px] text-[#6E6E73] sm:block">
                {r.auth === "key" ? "bearer" : "cookie"}
              </span>
              <ChevronDown className={`size-4 shrink-0 text-[#6E6E73] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="grid gap-3 border-t border-[#E8E8ED] bg-white p-4 lg:grid-cols-2">
                    <div className="min-w-0">
                      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-[#6E6E73]">Request — {r.desc}</p>
                      <Code title="curl" code={r.req} />
                    </div>
                    <div className="min-w-0">
                      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-[#6E6E73]">Response</p>
                      <Code title="json" code={r.res} light />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      {routes.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-[#6E6E73]">No endpoints match.</p>
      )}
    </div>
  );
}

export default function DocsPage() {
  const [active, setActive] = useState<string>("start");
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<"curl" | "sdk">("sdk");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const routes = useMemo(
    () =>
      ROUTES.filter(
        (r) =>
          r.path.toLowerCase().includes(filter.toLowerCase()) ||
          r.desc.toLowerCase().includes(filter.toLowerCase()) ||
          r.method.toLowerCase().includes(filter.toLowerCase()),
      ),
    [filter],
  );

  return (
    <main className="min-h-screen overflow-x-clip bg-white font-sans text-[#1D1D1F] antialiased">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#E8E8ED]/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <LogoMark size={22} /> RAGX
            <span className="font-mono text-xs font-normal text-[#6E6E73]">/ docs</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border border-[#E8E8ED] px-3 py-1.5 text-[13px] text-[#6E6E73] sm:flex">
              <Search className="size-3.5" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter endpoints…"
                className="w-36 bg-transparent outline-none placeholder:text-[#6E6E73]/50"
              />
            </div>
            <Link href="/dashboard" className="rounded-full bg-[#1D1D1F] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-black">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden pt-32 pb-10">
        <div className="blueprint absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-xs uppercase tracking-[0.2em] text-[#6E6E73]"
          >
            Documentation
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.025em] sm:text-6xl sm:leading-[1.04]"
          >
            Retrieval, <em className="font-serif font-medium italic">documented.</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-4 max-w-xl text-[17px] leading-relaxed text-[#6E6E73]"
          >
            Every route below is implemented and callable right now. Expand any endpoint for a
            copy-paste request and its exact response shape.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-6 flex items-center gap-2 overflow-x-auto rounded-xl border border-[#E8E8ED] bg-white px-4 py-3 font-mono text-[13px] sm:hidden"
          >
            <Search className="size-4 shrink-0 text-[#6E6E73]" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter endpoints…"
              className="w-full bg-transparent outline-none placeholder:text-[#6E6E73]/50"
            />
          </motion.div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-24 lg:grid-cols-[200px_1fr]">
        {/* sidebar */}
        <nav className="flex gap-1 overflow-x-auto lg:sticky lg:top-24 lg:flex-col lg:self-start">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setActive(s.id)}
              className={`relative whitespace-nowrap rounded-md px-3 py-2 text-[13.5px] transition-colors ${
                active === s.id ? "bg-[#F5F5F7] font-medium text-[#1D1D1F]" : "text-[#6E6E73] hover:text-[#1D1D1F]"
              }`}
            >
              {active === s.id && (
                <motion.span
                  layoutId="docs-active"
                  className="absolute left-0 top-1/2 hidden h-4 w-[2.5px] -translate-y-1/2 rounded-full bg-[#0071E3] lg:block"
                />
              )}
              {s.label}
            </a>
          ))}
        </nav>

        <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-w-0 space-y-16">
          {/* quickstart — two column */}
          <section id="start" className="scroll-mt-24">
            <h2 className="text-[26px] font-semibold tracking-[-0.02em]">Quickstart</h2>
            <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
              <motion.ol
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="min-w-0 space-y-0"
              >
                {[
                  ["Register", "Create your account. Sessions use httpOnly cookies."],
                  ["Create a project", "A Default API key is minted instantly — copy it once."],
                  ["Install the SDK", "bun add @ragx/sdk. One import, typed client."],
                  ["Search", "Query with knowledgeBase + topK. Get scored chunks with pages."],
                ].map(([t, d], i) => (
                  <motion.li
                    key={t}
                    variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: { delay: i * 0.09 } } }}
                    className="relative flex gap-4 pb-7 last:pb-0"
                  >
                    <span className="flex flex-col items-center">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full border border-[#E8E8ED] bg-white font-mono text-[11px] font-semibold">
                        {i + 1}
                      </span>
                      {i < 3 && <span className="my-1 w-px flex-1 bg-[#E8E8ED]" aria-hidden />}
                    </span>
                    <span className="pt-0.5">
                      <span className="block text-[15px] font-semibold">{t}</span>
                      <span className="mt-0.5 block text-[14px] leading-relaxed text-[#6E6E73]">{d}</span>
                    </span>
                  </motion.li>
                ))}
              </motion.ol>
              <div className="min-w-0 lg:sticky lg:top-24">
                <div className="mb-2 flex gap-1 rounded-lg bg-[#F5F5F7] p-1">
                  {(["sdk", "curl"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 rounded-md px-3 py-1.5 font-mono text-xs transition-all ${
                        tab === t ? "bg-white font-semibold shadow-[0_1px_4px_rgba(0,0,0,0.08)]" : "text-[#6E6E73]"
                      }`}
                    >
                      {t === "sdk" ? "TypeScript" : "cURL"}
                    </button>
                  ))}
                </div>
                {tab === "sdk" ? (
                  <Code wrap title="app.ts" code={`import RAGX from "@ragx/sdk";\n\nconst ragx = new RAGX({\n  apiKey: process.env.RAGX_API_KEY,\n});\n\nconst results = await ragx.search(\n  "How does authentication work?",\n  { knowledgeBase: "kb_123", topK: 5 }\n);\n// [{ text, score: 0.94,\n//    documentId, page: 12 }] `} />
                ) : (
                  <Code wrap title="bash" code={`curl -X POST http://localhost:3000/api/v1/projects \\\n  -b cookies.txt \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Docs Assistant"}'\n\n# → { project, apiKey:\n#     { key: "ragx_live_•••" } }`} />
                )}
              </div>
            </div>
          </section>

          {/* what it does — expandable pipeline */}
          <section id="process" className="scroll-mt-24">
            <h2 className="text-[26px] font-semibold tracking-[-0.02em]">What RAGX actually does</h2>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#6E6E73]">
              One upload travels six stages. Expand each stage to see the mechanics inside —
              this is the work you stop writing yourself.
            </p>
            <PipelineDeepDive />
          </section>

          {/* how parsing works */}
          <section id="parsing" className="scroll-mt-24">
            <h2 className="text-[26px] font-semibold tracking-[-0.02em]">How parsing works</h2>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#6E6E73]">
              Every format gets a dedicated loader. Nothing is flattened to plain text —
              structure survives all the way to the chunk.
            </p>
            <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-[#E8E8ED] bg-[#E8E8ED] sm:grid-cols-2">
              {[
                ["PDF", "Text layer extracted per page. Tables detected from line geometry → markdown + cell matrices. Embedded images captured with dimensions. Scanned pages fall back to OCR."],
                ["Markdown", "Headings, lists and fenced code blocks preserved natively — the cleanest input you can give RAGX."],
                ["DOCX", "Paragraphs, headings and tables recovered from the document XML, not pasted text."],
                ["HTML", "Scripts, styles and chrome stripped. Article content kept with heading hierarchy."],
                ["CSV", "Header row becomes field names; every record becomes a key–value block so retrieval sees labeled data."],
                ["TXT", "Paragraph-split plain text. No structure to lose, none invented."],
              ].map(([t, d], i) => (
                <motion.div
                  key={t}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 2) * 0.07 }}
                  className="bg-white p-5"
                >
                  <span className="rounded bg-[#F5F5F7] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#0071E3]">{t}</span>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#6E6E73]">{d}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[#E8E8ED] p-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-[#6E6E73]">Every parse emits the same shape</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[12.5px]">
                {["headings", "paragraphs", "tables", "images", "code"].map((s, i, a) => (
                  <span key={s} className="flex items-center gap-2">
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-lg border border-[#0071E3]/25 bg-[#0071E3]/[0.06] px-3 py-1.5 text-[#0071E3]"
                    >
                      {s}
                    </motion.span>
                    {i < a.length - 1 && <span className="text-[#E8E8ED]">+</span>}
                  </span>
                ))}
                <span className="text-[#E8E8ED]">→</span>
                <span className="rounded-lg bg-[#1D1D1F] px-3 py-1.5 text-white">chunks</span>
              </div>
            </div>
          </section>

          {/* traditional vs ragx */}
          <section id="versus" className="scroll-mt-24">
            <h2 className="text-[26px] font-semibold tracking-[-0.02em]">Traditional RAG vs RAGX</h2>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#6E6E73]">
              The DIY stack works until it meets real documents. Each row is a failure mode
              teams hit — and what RAGX does instead.
            </p>
            <div className="mt-6 overflow-hidden rounded-xl border border-[#E8E8ED]">
              {[
                ["Tables split mid-row", "Naive character splitters cut tables in half; answers quote half a row.", "One table = one chunk. Markdown + cell matrix stored together."],
                ["Headers lost", "Chunks arrive with no section context; retrieval can't tell setup from troubleshooting.", "Every chunk carries its header path as context."],
                ["Scanned PDFs return nothing", "Text-only extractors silently index zero content from scans.", "No text layer → OCR fallback, flagged per page."],
                ["Model swap = re-embed hell", "Vectors are tied to one model with no version record.", "Embeddings versioned per model; switching starts a background re-embed."],
                ["Key sprawl", "One shared secret in an env file, no revocation story.", "Per-project keys, SHA-256 hashed, shown once, revocable anytime."],
                ["No citations", "LLM answers with no page, no score, no source to check.", "Every chunk returns score + document + page + section."],
              ].map(([pain, diy, fix], i) => (
                <motion.div
                  key={pain}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.05, 0.25) }}
                  className={`grid gap-2 px-5 py-4 transition-colors hover:bg-[#F5F5F7]/50 sm:grid-cols-[1fr_1.4fr] sm:gap-6 ${i > 0 ? "border-t border-[#E8E8ED]" : ""}`}
                >
                  <div>
                    <p className="text-[14px] font-semibold">{pain}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#6E6E73]">{diy}</p>
                  </div>
                  <div className="flex gap-2.5 sm:pl-4 sm:border-l-2 sm:border-[#0071E3]/30">
                    <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[#0071E3]" aria-hidden />
                    <p className="text-[13.5px] leading-relaxed">{fix}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* process safety */}
          <section id="safety" className="scroll-mt-24">
            <h2 className="text-[26px] font-semibold tracking-[-0.02em]">Process safety</h2>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#6E6E73]">
              Retrieval infrastructure holds your documents and your keys. Here is exactly
              how each secret is treated — no trust-me language, just mechanics.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["API keys are hashed", "SHA-256 at rest. The raw secret exists once — on the creation screen — then only previews."],
                ["Passwords are armored", "Argon2id hashing. No reversible encryption, nothing to leak."],
                ["Sessions are httpOnly", "JWT lives in a cookie JavaScript cannot read. XSS can't steal it."],
                ["Ownership is checked", "Every project and key read verifies your user id. No IDOR by guessing UUIDs."],
                ["Revocation is soft-delete", "Revoked keys stay in the database with revokedAt — auditable, never reusable."],
                ["BYOK keys are write-only", "Provider keys are encrypted, never returned by any API, revealed only with confirmation."],
              ].map(([t, d], i) => (
                <motion.div
                  key={t}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 2) * 0.07 }}
                  className="rounded-xl border border-[#E8E8ED] p-5 transition-colors hover:border-[#0071E3]/40"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#0071E3]/10">
                      <Check className="size-3.5 text-[#0071E3]" strokeWidth={3} />
                    </span>
                    <p className="text-[14.5px] font-semibold">{t}</p>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[#6E6E73]">{d}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-4">
              <Code light title="what a key looks like after creation" code={`"key":      "rgx_live_••••••••••••••"   ← preview only\n"keyHash":  "sha256:9f2a…41bd"          ← what we store\n"raw key":  "gone — shown once, never again"`} />
            </div>
          </section>

          {/* concepts — two column definition rows with hover */}
          <section id="concepts" className="scroll-mt-24">
            <h2 className="text-[26px] font-semibold tracking-[-0.02em]">Core concepts</h2>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#6E6E73]">
              Six nouns. Everything in RAGX — dashboard, API and SDK — is built from them.
            </p>
            <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-[#E8E8ED] bg-[#E8E8ED] sm:grid-cols-2">
              {[
                ["Projects", "prj_…", "Isolated workspaces. Docs, chunks and keys live inside."],
                ["Documents", "PDF · MD · DOCX", "Parsed into headings, tables, images and code."],
                ["Collections", "kb_…", "Knowledge bases that scope every retrieval query."],
                ["Chunks", "ch_…", "Retrieval units. Tables never split; headers ride along."],
                ["Embeddings", "384-dim", "Hosted vectors, hash-cached, versioned per model."],
                ["API keys", "ragx_live_…", "SHA-256 hashed. Shown exactly once, then previews."],
              ].map(([t, tag, d], i) => (
                <motion.div
                  key={t}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 2) * 0.07 }}
                  className="group bg-white p-5 transition-colors hover:bg-[#F5F5F7]/60"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-semibold">{t}</p>
                    <span className="rounded bg-[#F5F5F7] px-1.5 py-0.5 font-mono text-[10.5px] text-[#0071E3] transition-colors group-hover:bg-[#0071E3]/10">
                      {tag}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6E6E73]">{d}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* api explorer */}
          <section id="api" className="scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[26px] font-semibold tracking-[-0.02em]">API reference</h2>
                <p className="mt-2 break-all font-mono text-[13px] text-[#6E6E73]">
                  <code className="rounded bg-[#F5F5F7] px-1.5 py-0.5">http://localhost:3000/api/v1</code>
                  {"  "}· {routes.length} of {ROUTES.length} routes
                </p>
              </div>
            </div>
            <div className="mt-5">
              <Explorer routes={routes} />
            </div>
          </section>

          {/* sdk + byok two column */}
          <section id="sdk" className="scroll-mt-24">
            <h2 className="text-[26px] font-semibold tracking-[-0.02em]">SDK & BYOK</h2>
            <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">Retrieval + generation in one call</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#6E6E73]">
                  <code className="rounded bg-[#F5F5F7] px-1 font-mono text-[12.5px]">ask()</code> searches
                  RAGX, then calls your provider directly with your key. RAGX never sees it.
                </p>
                <p className="mt-4 text-[15px] font-semibold">Your key, your model, your bill</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#6E6E73]">
                  Any OpenAI-compatible provider. Prefer the dashboard? Store keys under
                  Settings → Environment Variables — encrypted, confirmed reveals only.
                </p>
              </div>
              <Code title="ask.ts" code={`const ragx = new RAGX({\n  apiKey: process.env.RAGX_API_KEY,\n  llm: {\n    provider: "groq",\n    model: "llama-3.3-70b-versatile",\n    apiKey: process.env.GROQ_API_KEY, // yours, never ours\n  },\n});\n\nconst answer = await ragx.ask("Explain MVCC", { topK: 5 });`} />
            </div>
          </section>
        </motion.article>
      </div>
    </main>
  );
}
