"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Search,
  Terminal,
} from "lucide-react";
import { LogoMark } from "../../components/Logo";

const SECTIONS = [
  { id: "start", label: "Quickstart" },
  { id: "process", label: "Pipeline" },
  { id: "parsing", label: "Parsing" },
  { id: "versus", label: "RAGX vs DIY" },
  { id: "safety", label: "Security" },
  { id: "concepts", label: "Concepts" },
  { id: "api", label: "API" },
  { id: "sdk", label: "SDK" },
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
  {
    method: "POST",
    path: "/auth/register",
    desc: "Create account",
    auth: "cookie",
    req: `curl -X POST ${BASE}/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"username":"keshav","email":"you@dev.io","password":"••••••••"}'`,
    res: `{
  "id": "usr_9f2a",
  "username": "keshav",
  "email": "you@dev.io"
}`,
  },
  {
    method: "POST",
    path: "/auth/login",
    desc: "Create session",
    auth: "cookie",
    req: `curl -X POST ${BASE}/auth/login -c cookies.txt \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@dev.io","password":"••••••••"}'`,
    res: `{
  "id": "usr_9f2a",
  "username": "keshav"
}`,
  },
  {
    method: "GET",
    path: "/auth/me",
    desc: "Current user",
    auth: "cookie",
    req: `curl ${BASE}/auth/me -b cookies.txt`,
    res: `{
  "id": "usr_9f2a",
  "email": "you@dev.io"
}`,
  },
  {
    method: "POST",
    path: "/auth/logout",
    desc: "Clear session",
    auth: "cookie",
    req: `curl -X POST ${BASE}/auth/logout -b cookies.txt`,
    res: `{
  "success": true
}`,
  },
  {
    method: "POST",
    path: "/projects",
    desc: "Create project",
    auth: "key",
    req: `curl -X POST ${BASE}/projects \\
  -H "Authorization: Bearer ragx_live_•••" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Docs Assistant"}'`,
    res: `{
  "project": {
    "id": "prj_8f92",
    "name": "Docs Assistant"
  },
  "apiKey": {
    "key": "ragx_live_•••",
    "note": "shown once"
  }
}`,
  },
  {
    method: "GET",
    path: "/projects",
    desc: "List projects",
    auth: "key",
    req: `curl ${BASE}/projects \\
  -H "Authorization: Bearer ragx_live_•••"`,
    res: `[
  {
    "id": "prj_8f92",
    "name": "Docs Assistant"
  }
]`,
  },
  {
    method: "GET",
    path: "/projects/:projectId",
    desc: "Get project",
    auth: "key",
    req: `curl ${BASE}/projects/prj_8f92 \\
  -H "Authorization: Bearer ragx_live_•••"`,
    res: `{
  "id": "prj_8f92",
  "name": "Docs Assistant",
  "documents": 482
}`,
  },
  {
    method: "PATCH",
    path: "/projects/:projectId",
    desc: "Update project",
    auth: "key",
    req: `curl -X PATCH ${BASE}/projects/prj_8f92 \\
  -H "Authorization: Bearer ragx_live_•••" \\
  -H "Content-Type: application/json" \\
  -d '{"description":"Support knowledge"}'`,
    res: `{
  "id": "prj_8f92",
  "description": "Support knowledge"
}`,
  },
  {
    method: "DELETE",
    path: "/projects/:projectId",
    desc: "Delete project",
    auth: "key",
    req: `curl -X DELETE ${BASE}/projects/prj_8f92 \\
  -H "Authorization: Bearer ragx_live_•••"`,
    res: `{
  "success": true
}`,
  },
  {
    method: "POST",
    path: "/projects/:projectId/api-keys",
    desc: "Mint API key",
    auth: "key",
    req: `curl -X POST ${BASE}/projects/prj_8f92/api-keys \\
  -H "Authorization: Bearer ragx_live_•••" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"ios-app"}'`,
    res: `{
  "id": "key_41bd",
  "key": "rgx_live_•••",
  "note": "copy now — never shown again"
}`,
  },
  {
    method: "GET",
    path: "/projects/:projectId/api-keys",
    desc: "List API keys",
    auth: "key",
    req: `curl ${BASE}/projects/prj_8f92/api-keys \\
  -H "Authorization: Bearer ragx_live_•••"`,
    res: `[
  {
    "id": "key_41bd",
    "preview": "rgx_live_••••••",
    "name": "ios-app"
  }
]`,
  },
  {
    method: "DELETE",
    path: "/projects/:projectId/api-keys/:apiKeyId",
    desc: "Revoke API key",
    auth: "key",
    req: `curl -X DELETE ${BASE}/projects/prj_8f92/api-keys/key_41bd \\
  -H "Authorization: Bearer ragx_live_•••"`,
    res: `{
  "id": "key_41bd",
  "revokedAt": "2026-09-25T…"
}`,
  },
];

const METHOD_COLOR: Record<Route["method"], string> = {
  GET: "#0071E3",
  POST: "#18864B",
  PATCH: "#B45309",
  DELETE: "#D1242F",
};

const PIPELINE = [
  {
    n: "01",
    title: "Load",
    meta: "INPUT",
    text: "Accept PDF, DOCX, TXT, MD, HTML and CSV. Unsupported formats fail explicitly.",
  },
  {
    n: "02",
    title: "Parse",
    meta: "STRUCTURE",
    text: "Recover headings, paragraphs, tables, images and code into one normalized representation.",
  },
  {
    n: "03",
    title: "Chunk",
    meta: "CONTEXT",
    text: "Split recursively while preserving header paths, page numbers and atomic tables.",
  },
  {
    n: "04",
    title: "Embed",
    meta: "VECTOR",
    text: "Generate embeddings and hash-cache identical content to avoid duplicate work.",
  },
  {
    n: "05",
    title: "Retrieve",
    meta: "SEARCH",
    text: "Embed the query, search pgvector, filter weak matches and optionally rerank.",
  },
  {
    n: "06",
    title: "Context",
    meta: "OUTPUT",
    text: "Return text, similarity score, document, page and section. Generation stays yours.",
  },
];

function Code({
  code,
  title,
  light = false,
}: {
  code: string;
  title?: string;
  light?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  return (
    <div
      className={[
        "overflow-hidden border",
        light
          ? "border-[#E5E5EA] bg-[#F7F7F8]"
          : "border-white/[0.08] bg-[#161617]",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-10 items-center justify-between border-b px-4",
          light ? "border-[#E5E5EA]" : "border-white/[0.08]",
        ].join(" ")}
      >
        <span
          className={[
            "font-mono text-[11px]",
            light ? "text-[#86868B]" : "text-white/35",
          ].join(" ")}
        >
          {title ?? "code"}
        </span>

        <button
          onClick={copy}
          className={[
            "flex items-center gap-1.5 font-mono text-[11px] transition-colors",
            light
              ? "text-[#86868B] hover:text-[#1D1D1F]"
              : "text-white/35 hover:text-white",
          ].join(" ")}
        >
          {copied ? (
            <Check className="size-3.5 text-[#0071E3]" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? "copied" : "copy"}
        </button>
      </div>

      <pre
        className={[
          "overflow-x-auto p-5 font-mono text-[12px] leading-[1.8]",
          light ? "text-[#1D1D1F]" : "text-white/80",
        ].join(" ")}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function RetrievalVisual() {
  return (
    <div className="relative h-[260px] w-full overflow-hidden border border-[#E5E5EA] bg-[#FAFAFA]">
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(#E5E5EA 1px, transparent 1px), linear-gradient(90deg, #E5E5EA 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[280px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: i * 0.08,
                duration: 0.5,
              }}
              className={[
                "absolute left-0 h-8 border bg-white",
                i === 2
                  ? "w-[190px] border-[#0071E3]/30 bg-[#0071E3]/[0.06]"
                  : "w-[150px] border-[#E5E5EA]",
              ].join(" ")}
              style={{
                top: `${i * 39}px`,
                left: `${i % 2 === 0 ? 0 : 22}px`,
              }}
            >
              <div className="flex h-full items-center px-3">
                <div
                  className={[
                    "h-1.5 rounded-full",
                    i === 2
                      ? "w-[115px] bg-[#0071E3]"
                      : "w-[75px] bg-[#D2D2D7]",
                  ].join(" ")}
                />
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: [0, 1, 1, 0], x: [80, 25, 0, -12] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              repeatDelay: 1.4,
              ease: "easeInOut",
            }}
            className="absolute -right-4 top-[72px] flex items-center gap-3"
          >
            <div className="h-px w-12 bg-[#0071E3]" />

            <div className="grid size-9 place-items-center rounded-full border border-[#0071E3]/30 bg-white shadow-[0_4px_18px_rgba(0,113,227,0.14)]">
              <ArrowUpRight className="size-4 text-[#0071E3]" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              repeatDelay: 1.4,
              times: [0, 0.35, 1],
            }}
            className="absolute -bottom-12 left-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[#0071E3]"
          >
            relevant context
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-4 left-5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#86868B]">
        RAGX / RETRIEVAL TRACE
      </div>
    </div>
  );
}

function PipelineExplorer() {
  const [open, setOpen] = useState("03");

  return (
    <div className="border border-[#E5E5EA]">
      {PIPELINE.map((stage, i) => {
        const isOpen = open === stage.n;

        return (
          <div
            key={stage.n}
            className={i > 0 ? "border-t border-[#E5E5EA]" : ""}
          >
            <button
              onClick={() => setOpen(isOpen ? "" : stage.n)}
              className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#FAFAFA]"
            >
              <span
                className={[
                  "font-mono text-[11px] font-medium",
                  isOpen ? "text-[#0071E3]" : "text-[#86868B]",
                ].join(" ")}
              >
                {stage.n}
              </span>

              <span className="w-20 text-[14px] font-semibold">
                {stage.title}
              </span>

              <span className="hidden flex-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#AEAEB2] sm:block">
                {stage.meta}
              </span>

              <ChevronDown
                className={[
                  "size-4 text-[#86868B] transition-transform",
                  isOpen ? "rotate-180" : "",
                ].join(" ")}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-[#E5E5EA] bg-[#FAFAFA] px-5 py-5 pl-[76px]">
                    <p className="max-w-2xl text-[14px] leading-7 text-[#6E6E73]">
                      {stage.text}
                    </p>
                  </div>
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
  const [open, setOpen] = useState<string | null>(routes[0]?.path ?? null);

  useEffect(() => {
    if (!routes.some((route) => route.path === open)) {
      setOpen(routes[0]?.path ?? null);
    }
  }, [routes, open]);

  return (
    <div className="border border-[#E5E5EA]">
      {routes.map((route, index) => {
        const isOpen = open === route.path;

        return (
          <div
            key={`${route.method}-${route.path}`}
            className={index > 0 ? "border-t border-[#E5E5EA]" : ""}
          >
            <button
              onClick={() => setOpen(isOpen ? null : route.path)}
              className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#FAFAFA]"
            >
              <span
                className="w-14 shrink-0 font-mono text-[11px] font-semibold"
                style={{ color: METHOD_COLOR[route.method] }}
              >
                {route.method}
              </span>

              <code className="min-w-0 flex-1 truncate font-mono text-[12px]">
                {route.path}
              </code>

              <span className="hidden font-mono text-[10px] text-[#AEAEB2] sm:block">
                {route.auth === "key" ? "BEARER" : "COOKIE"}
              </span>

              <ChevronDown
                className={[
                  "size-4 shrink-0 text-[#86868B] transition-transform",
                  isOpen ? "rotate-180" : "",
                ].join(" ")}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="grid gap-0 border-t border-[#E5E5EA] lg:grid-cols-2">
                    <div className="min-w-0 border-b border-[#E5E5EA] p-4 lg:border-b-0 lg:border-r">
                      <div className="mb-2 flex items-center gap-2">
                        <Terminal className="size-3.5 text-[#86868B]" />
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#86868B]">
                          request
                        </span>
                      </div>

                      <Code title={route.desc} code={route.req} />
                    </div>

                    <div className="min-w-0 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-[#18864B]" />
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#86868B]">
                          response
                        </span>
                      </div>

                      <Code title="application/json" code={route.res} light />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {!routes.length && (
        <div className="px-5 py-12 text-center">
          <Search className="mx-auto size-5 text-[#AEAEB2]" />
          <p className="mt-3 text-sm text-[#86868B]">
            No endpoints match that filter.
          </p>
        </div>
      )}
    </div>
  );
}

export default function DocsPage() {
  const [active, setActive] = useState("start");
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<"sdk" | "curl">("sdk");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) setActive(visible.target.id);
      },
      {
        rootMargin: "-15% 0px -70% 0px",
        threshold: [0, 0.2, 0.5],
      },
    );

    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const routes = useMemo(() => {
    const query = filter.trim().toLowerCase();

    if (!query) return ROUTES;

    return ROUTES.filter(
      (route) =>
        route.path.toLowerCase().includes(query) ||
        route.desc.toLowerCase().includes(query) ||
        route.method.toLowerCase().includes(query),
    );
  }, [filter]);

  return (
    <main className="min-h-screen bg-white text-[#1D1D1F] antialiased">
      {/* ─────────────────────────────────────────
          HEADER
      ────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#E5E5EA]/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2 text-[14px] font-semibold tracking-[-0.02em]"
          >
            <LogoMark size={21} />

            <span>RAGX</span>

            <span className="font-mono text-[11px] font-normal text-[#AEAEB2]">
              / docs
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden h-8 items-center gap-2 border border-[#E5E5EA] px-3 sm:flex">
              <Search className="size-3.5 text-[#86868B]" />

              <input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Filter API…"
                className="w-36 bg-transparent font-mono text-[11px] outline-none placeholder:text-[#AEAEB2]"
              />
            </div>

            <Link
              href="/dashboard"
              className="flex h-8 items-center rounded-md bg-[#1D1D1F] px-3.5 text-[12px] font-medium text-white transition-transform hover:-translate-y-px"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────
          HERO
      ────────────────────────────────────────── */}
      <section className="border-b border-[#E5E5EA] pt-28">
        <div className="mx-auto grid max-w-7xl gap-0 px-5 sm:px-8 lg:grid-cols-[1fr_420px]">
          <div className="flex min-h-[430px] flex-col justify-center py-16 lg:pr-16">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#86868B]"
            >
              <span className="size-1.5 rounded-full bg-[#0071E3]" />
              RAGX documentation
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.055em] sm:text-7xl sm:leading-[0.98]"
            >
              Retrieval,
              <br />
              <span className="text-[#86868B]">without the glue.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mt-6 max-w-xl text-[16px] leading-7 text-[#6E6E73]"
            >
              Parsing, chunking, embeddings and retrieval infrastructure
              designed to disappear behind one clean API.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="mt-7 flex flex-wrap items-center gap-2"
            >
              <a
                href="#start"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-[#1D1D1F] px-4 text-[12px] font-medium text-white transition-transform hover:-translate-y-px"
              >
                Get started
                <ArrowUpRight className="size-3.5" />
              </a>

              <a
                href="#api"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-[#E5E5EA] px-4 font-mono text-[11px] text-[#6E6E73] transition-colors hover:bg-[#F5F5F7]"
              >
                API reference
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex items-center border-t border-[#E5E5EA] py-10 lg:border-l lg:border-t-0 lg:px-10"
          >
            <RetrievalVisual />
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          BODY
      ────────────────────────────────────────── */}
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[180px_minmax(0,1fr)]">
        {/* SIDEBAR */}
        <nav className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[#AEAEB2]">
            Contents
          </div>

          <div className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setActive(section.id)}
                className={[
                  "relative whitespace-nowrap px-2.5 py-1.5 text-[12.5px] transition-colors",
                  active === section.id
                    ? "font-medium text-[#1D1D1F]"
                    : "text-[#86868B] hover:text-[#1D1D1F]",
                ].join(" ")}
              >
                {active === section.id && (
                  <motion.span
                    layoutId="docs-indicator"
                    className="absolute -left-1 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[#0071E3]"
                  />
                )}

                {section.label}
              </a>
            ))}
          </div>
        </nav>

        <article className="min-w-0 space-y-28">
          {/* QUICKSTART */}
          <section id="start" className="scroll-mt-24">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0071E3]">
                  01 / Quickstart
                </div>

                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  From zero to retrieval.
                </h2>

                <p className="mt-3 text-[14px] leading-7 text-[#6E6E73]">
                  Four steps. Your application owns the experience. RAGX owns
                  the retrieval machinery.
                </p>

                <div className="mt-8 border-l border-[#E5E5EA]">
                  {[
                    [
                      "Register",
                      "Create your account and session.",
                    ],
                    [
                      "Create a project",
                      "Get an isolated project and API key.",
                    ],
                    [
                      "Install the SDK",
                      "Use the typed client from your app.",
                    ],
                    [
                      "Retrieve",
                      "Search your knowledge base and receive scored context.",
                    ],
                  ].map(([title, description], index) => (
                    <motion.div
                      key={title}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.07 }}
                      className="relative py-2 pl-6"
                    >
                      <span className="absolute -left-[4px] top-[13px] size-2 rounded-full border-2 border-white bg-[#0071E3]" />

                      <p className="text-[14px] font-semibold">
                        {index + 1}. {title}
                      </p>

                      <p className="mt-0.5 text-[13px] text-[#86868B]">
                        {description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex border-b border-[#E5E5EA]">
                  {(["sdk", "curl"] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => setTab(value)}
                      className={[
                        "border-b-2 px-3 py-2 font-mono text-[11px] transition-colors",
                        tab === value
                          ? "border-[#0071E3] text-[#1D1D1F]"
                          : "border-transparent text-[#86868B]",
                      ].join(" ")}
                    >
                      {value === "sdk" ? "TypeScript" : "cURL"}
                    </button>
                  ))}
                </div>

                {tab === "sdk" ? (
                  <Code
                    title="app.ts"
                    code={`import RAGX from "@ragx/sdk";

const ragx = new RAGX({
  apiKey: process.env.RAGX_API_KEY,
});

const results = await ragx.search(
  "How does authentication work?",
  {
    knowledgeBase: "kb_123",
    topK: 5,
  }
);

// [
//   {
//     text,
//     score: 0.94,
//     documentId,
//     page: 12
//   }
// ]`}
                  />
                ) : (
                  <Code
                    title="terminal"
                    code={`curl -X POST ${BASE}/projects \\
  -b cookies.txt \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Docs Assistant"}'

# → { project, apiKey: { key: "ragx_live_•••" } }`}
                  />
                )}
              </div>
            </div>
          </section>

          {/* PIPELINE */}
          <section id="process" className="scroll-mt-24">
            <div className="max-w-2xl">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0071E3]">
                02 / Pipeline
              </div>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                The work behind one query.
              </h2>

              <p className="mt-3 text-[14px] leading-7 text-[#6E6E73]">
                RAGX turns messy documents into retrievable context through a
                deterministic pipeline.
              </p>
            </div>

            <div className="mt-8">
              <PipelineExplorer />
            </div>
          </section>

          {/* PARSING */}
          <section id="parsing" className="scroll-mt-24">
            <div className="max-w-2xl">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0071E3]">
                03 / Parsing
              </div>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                Structure survives the parser.
              </h2>

              <p className="mt-3 text-[14px] leading-7 text-[#6E6E73]">
                A PDF isn't just text. Neither is a DOCX, spreadsheet or web
                page. RAGX preserves useful structure before retrieval ever
                starts.
              </p>
            </div>

            <div className="mt-8 grid border border-[#E5E5EA] sm:grid-cols-2">
              {[
                [
                  "PDF",
                  "Per-page text extraction, tables, embedded images and OCR fallback for scanned pages.",
                ],
                [
                  "Markdown",
                  "Headings, lists and fenced code blocks remain native structure.",
                ],
                [
                  "DOCX",
                  "Paragraphs, headings and tables recovered from document XML.",
                ],
                [
                  "HTML",
                  "Scripts and styles removed while article hierarchy remains intact.",
                ],
                [
                  "CSV",
                  "Headers become field names so each record remains semantically labeled.",
                ],
                [
                  "TXT",
                  "Paragraph-aware plain text with no structure invented.",
                ],
              ].map(([name, description], index) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (index % 2) * 0.06 }}
                  className={[
                    "p-5",
                    index % 2 === 1 ? "sm:border-l sm:border-[#E5E5EA]" : "",
                    index >= 2 ? "border-t border-[#E5E5EA]" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold text-[#0071E3]">
                      {name}
                    </span>

                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#AEAEB2]">
                      loader
                    </span>
                  </div>

                  <p className="mt-3 text-[13px] leading-6 text-[#6E6E73]">
                    {description}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border border-[#E5E5EA] px-5 py-4">
              {["headings", "paragraphs", "tables", "images", "code"].map(
                (item, index) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="border border-[#0071E3]/20 bg-[#0071E3]/[0.04] px-2.5 py-1 font-mono text-[10px] text-[#0071E3]">
                      {item}
                    </span>

                    {index < 4 && (
                      <span className="text-[#D2D2D7]">+</span>
                    )}
                  </div>
                ),
              )}

              <span className="text-[#AEAEB2]">→</span>

              <span className="bg-[#1D1D1F] px-2.5 py-1 font-mono text-[10px] text-white">
                normalized chunk
              </span>
            </div>
          </section>

          {/* VERSUS */}
          <section id="versus" className="scroll-mt-24">
            <div className="max-w-2xl">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0071E3]">
                04 / RAGX vs DIY
              </div>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                The details are the product.
              </h2>

              <p className="mt-3 text-[14px] leading-7 text-[#6E6E73]">
                Building RAG isn't hard because embeddings are mysterious. It's
                hard because real documents keep finding edge cases.
              </p>
            </div>

            <div className="mt-8 border border-[#E5E5EA]">
              {[
                [
                  "Tables split mid-row",
                  "Naive splitters can destroy row relationships.",
                  "Tables remain atomic chunks with their structure preserved.",
                ],
                [
                  "Headers disappear",
                  "A chunk loses the section that gives it meaning.",
                  "Header paths travel with every chunk.",
                ],
                [
                  "Scanned PDFs",
                  "Text-only extraction returns empty content.",
                  "OCR fallback handles pages without a usable text layer.",
                ],
                [
                  "Model migration",
                  "Changing embedding models can become an indexing project.",
                  "Model metadata and vector dimensions are versioned.",
                ],
                [
                  "API key sprawl",
                  "One shared secret becomes difficult to rotate.",
                  "Project-scoped keys can be created and revoked independently.",
                ],
                [
                  "Missing provenance",
                  "Generated answers can lose their original source.",
                  "Retrieved chunks carry document, page, section and score.",
                ],
              ].map(([problem, oldWay, ragx], index) => (
                <div
                  key={problem}
                  className={[
                    "grid gap-5 px-5 py-5 lg:grid-cols-[1fr_1fr_1fr]",
                    index > 0 ? "border-t border-[#E5E5EA]" : "",
                  ].join(" ")}
                >
                  <p className="text-[13.5px] font-semibold">{problem}</p>

                  <p className="text-[13px] leading-6 text-[#86868B]">
                    {oldWay}
                  </p>

                  <div className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#0071E3]" />

                    <p className="text-[13px] leading-6">{ragx}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECURITY */}
          <section id="safety" className="scroll-mt-24">
            <div className="max-w-2xl">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0071E3]">
                05 / Security
              </div>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                Secrets should have a lifecycle.
              </h2>

              <p className="mt-3 text-[14px] leading-7 text-[#6E6E73]">
                RAGX treats authentication and provider credentials as
                infrastructure primitives, not UI fields.
              </p>
            </div>

            <div className="mt-8 grid border border-[#E5E5EA] sm:grid-cols-2 lg:grid-cols-3">
              {[
                [
                  "API keys",
                  "SHA-256 hashed at rest. The raw secret is shown only at creation.",
                ],
                [
                  "Passwords",
                  "Argon2id hashing. No reversible password storage.",
                ],
                [
                  "Sessions",
                  "httpOnly cookies keep session credentials outside browser JavaScript.",
                ],
                [
                  "Ownership",
                  "Project and key operations verify the authenticated user.",
                ],
                [
                  "Revocation",
                  "Revoked keys retain lifecycle metadata and cannot be reused.",
                ],
                [
                  "BYOK",
                  "Provider credentials are treated as write-only secrets.",
                ],
              ].map(([title, description], index) => (
                <div
                  key={title}
                  className={[
                    "p-5",
                    index > 0 ? "border-t border-[#E5E5EA]" : "",
                    index % 3 !== 0 ? "lg:border-l" : "",
                    index % 2 !== 0 ? "sm:border-l" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <Check className="size-3.5 text-[#0071E3]" strokeWidth={3} />
                    <p className="text-[13.5px] font-semibold">{title}</p>
                  </div>

                  <p className="mt-2.5 text-[12.5px] leading-6 text-[#86868B]">
                    {description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Code
                light
                title="stored representation"
                code={`"key":      "rgx_live_••••••••"   // preview
"keyHash":  "sha256:9f2a…41bd"  // stored
"rawKey":   null                 // never persisted`}
              />
            </div>
          </section>

          {/* CONCEPTS */}
          <section id="concepts" className="scroll-mt-24">
            <div className="max-w-2xl">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0071E3]">
                06 / Concepts
              </div>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                Six primitives.
              </h2>

              <p className="mt-3 text-[14px] leading-7 text-[#6E6E73]">
                Everything in the dashboard, API and SDK reduces to these
                primitives.
              </p>
            </div>

            <div className="mt-8 border border-[#E5E5EA]">
              {[
                ["Projects", "prj_…", "Isolated environments for documents, chunks and keys."],
                ["Documents", "doc_…", "Source files parsed into structured content."],
                ["Collections", "kb_…", "Knowledge bases that scope retrieval."],
                ["Chunks", "ch_…", "Atomic retrieval units carrying their context."],
                ["Embeddings", "384-dim", "Versioned vectors generated from chunk content."],
                ["API keys", "rgx_live_…", "Project credentials with explicit lifecycle control."],
              ].map(([title, tag, description], index) => (
                <div
                  key={title}
                  className={[
                    "group grid gap-3 px-5 py-4 transition-colors hover:bg-[#FAFAFA] sm:grid-cols-[160px_100px_1fr]",
                    index > 0 ? "border-t border-[#E5E5EA]" : "",
                  ].join(" ")}
                >
                  <p className="text-[13.5px] font-semibold">{title}</p>

                  <span className="font-mono text-[10px] text-[#0071E3]">
                    {tag}
                  </span>

                  <p className="text-[13px] leading-6 text-[#86868B]">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* API */}
          <section id="api" className="scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0071E3]">
                  07 / API
                </div>

                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  API reference.
                </h2>

                <p className="mt-3 font-mono text-[11px] text-[#86868B]">
                  {BASE}
                  <span className="mx-2 text-[#D2D2D7]">·</span>
                  {routes.length}/{ROUTES.length} routes
                </p>
              </div>

              <div className="flex h-8 items-center gap-2 border border-[#E5E5EA] px-3 sm:hidden">
                <Search className="size-3.5 text-[#86868B]" />

                <input
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Filter…"
                  className="w-32 bg-transparent font-mono text-[11px] outline-none"
                />
              </div>
            </div>

            <div className="mt-8">
              <Explorer routes={routes} />
            </div>
          </section>

          {/* SDK */}
          <section id="sdk" className="scroll-mt-24">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0071E3]">
                  08 / SDK
                </div>

                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  Bring your model.
                </h2>

                <p className="mt-4 text-[14px] leading-7 text-[#6E6E73]">
                  RAGX handles retrieval. Your application decides what model
                  generates the final answer.
                </p>

                <div className="mt-7 space-y-5">
                  <div>
                    <p className="text-[13.5px] font-semibold">
                      Retrieval + generation
                    </p>

                    <p className="mt-1.5 text-[13px] leading-6 text-[#86868B]">
                      Use{" "}
                      <code className="bg-[#F5F5F7] px-1 font-mono text-[11px]">
                        ask()
                      </code>{" "}
                      when you want retrieval and provider generation in one
                      operation.
                    </p>
                  </div>

                  <div>
                    <p className="text-[13.5px] font-semibold">
                      BYOK
                    </p>

                    <p className="mt-1.5 text-[13px] leading-6 text-[#86868B]">
                      Supply your provider credentials instead of coupling your
                      application to another platform's model billing.
                    </p>
                  </div>
                </div>
              </div>

              <Code
                title="ask.ts"
                code={`const ragx = new RAGX({
  apiKey: process.env.RAGX_API_KEY,

  llm: {
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    apiKey: process.env.GROQ_API_KEY,
  },
});

const answer = await ragx.ask(
  "Explain MVCC",
  { topK: 5 }
);`}
              />
            </div>
          </section>
        </article>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#E5E5EA]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2">
            <LogoMark size={18} />
            <span className="text-[12px] font-semibold">RAGX</span>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#AEAEB2]">
            retrieval infrastructure
          </p>
        </div>
      </footer>
    </main>
  );
}
