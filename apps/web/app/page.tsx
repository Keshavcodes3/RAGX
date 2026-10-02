"use client";

import {
  AnimatePresence,
  motion,
  MotionConfig,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Copy,
  FileText,
  Github,
  Search,
  Terminal,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { RagComparisonFlow } from "../components/Landing/BoringPart";
import PricingPage from "../components/Landing/Pricing";

/* ============================================================================
 * RAGX — MOTION SYSTEM
 * ========================================================================== */

const EASE = [0.22, 1, 0.36, 1] as const;

const SPRING = {
  soft: { type: "spring" as const, stiffness: 180, damping: 24, mass: 0.8 },
  smooth: { type: "spring" as const, stiffness: 260, damping: 28, mass: 0.7 },
  snappy: { type: "spring" as const, stiffness: 500, damping: 34, mass: 0.55 },
  magnetic: { type: "spring" as const, stiffness: 700, damping: 40, mass: 0.45 },
};

const fadeUp = {
  hidden: { opacity: 0, y: 22, filter: "blur(8px)" },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, delay, ease: EASE },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.065 } },
};

/* ============================================================================
 * DATA
 * ========================================================================== */

const LINKS = [
  { label: "Docs", href: "#code" },
  { label: "API", href: "#code" },
  { label: "GitHub", href: "#cta" },
  { label: "Pricing", href: "#cta" },
];

const PIPELINE = [
  "Documents",
  "Parsing",
  "Chunking",
  "Embeddings",
  "Retrieval",
  "Context",
];

const DOCUMENTS = ["manual.pdf", "documentation.pdf", "api-reference.md"];

const RETRIEVAL_RESULTS = [
  { id: "042", title: "Authentication", score: 0.94, page: 12 },
  { id: "017", title: "Authorization", score: 0.89, page: 18 },
  { id: "091", title: "Sessions", score: 0.81, page: 23 },
  { id: "031", title: "Configuration", score: 0.67, page: 31 },
];

const STEPS = [
  { n: "01", title: "Load", desc: "Bring PDFs, documents, markdown, and supported sources into RAGX." },
  { n: "02", title: "Parse", desc: "Turn messy documents into structured content." },
  { n: "03", title: "Chunk", desc: "Split content into meaningful retrieval units." },
  { n: "04", title: "Embed", desc: "Generate vector representations using the provider you choose." },
  { n: "05", title: "Retrieve", desc: "Search your knowledge base using semantic retrieval." },
  { n: "06", title: "Build", desc: "Send retrieved context to whatever LLM your application uses." },
];

const PROVIDERS = [
  { name: "OpenAI", key: "sk-…9f2a" },
  { name: "Mistral", key: "ms-…41bd" },
  { name: "Gemini", key: "AI…77e0" },
  { name: "Custom", key: "https://…" },
];

/* ============================================================================
 * UTILS
 * ========================================================================== */

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  return { copied, copy };
}

function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect width="24" height="24" rx="6" fill="#0071E3" />
      <path
        d="M7 16.5V7.5h2.1c2.15 0 3.4 1.05 3.4 2.7 0 1.05-.6 1.9-1.55 2.25L13.8 16.5h-2.2l-2.15-3.55H9V16.5H7Zm2-5.35h.85c.95 0 1.5-.45 1.5-1.2s-.55-1.15-1.5-1.15H9v2.35Z"
        fill="white"
      />
    </svg>
  );
}

/* ============================================================================
 * MOTION PRIMITIVES
 * ========================================================================== */

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : "hidden"}
      animate={isInView ? "visible" : "hidden"}
      variants={fadeUp}
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function MagneticButton({
  children,
  href,
  variant = "primary",
  className,
  onClick,
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "ghost";
  className?: string;
  onClick?: () => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING.magnetic);
  const springY = useSpring(y, SPRING.magnetic);

  const handleMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * 0.12);
    y.set((event.clientY - (rect.top + rect.height / 2)) * 0.12);
  };

  return (
    <motion.a
      href={href}
      onClick={onClick}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium transition-colors",
        variant === "primary"
          ? "bg-[#0071E3] text-white hover:bg-[#0077ED]"
          : "text-[#0071E3] hover:bg-[#F5F5F7]",
        className,
      )}
    >
      {children}
    </motion.a>
  );
}

/* ============================================================================
 * BACKGROUND
 * ========================================================================== */

function Blueprint() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.035) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <motion.div
        className="absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-[#0071E3]/[0.045] blur-[120px]"
        animate={{ scale: [1, 1.04, 1], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ============================================================================
 * NAVIGATION
 * ========================================================================== */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const { scrollY } = useScroll();
  const reduced = useReducedMotion();

  useEffect(() => {
    return scrollY.on("change", (value) => {
      setScrolled(value > 32);
      if (value <= 32) setOpen(false);
    });
  }, [scrollY]);

  return (
    <motion.header
      initial={reduced ? false : { y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4"
    >
      <motion.div
        layout
        animate={{ maxWidth: scrolled ? 700 : 1152, y: scrolled ? 12 : 0 }}
        transition={SPRING.smooth}
        className={cn(
          "pointer-events-auto w-full",
          scrolled
            ? "rounded-full border border-[#E8E8ED] bg-white/85 shadow-[0_10px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div
          className={cn(
            "mx-auto flex items-center justify-between",
            scrolled ? "h-12 px-4" : "h-14 px-2 sm:px-4",
          )}
        >
          <a href="#top" className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">
            <motion.span
              whileHover={{ rotate: -8, scale: 1.06 }}
              transition={SPRING.snappy}
              className="inline-flex"
            >
              <LogoMark size={24} />
            </motion.span>
            <span>RAGX</span>
            <span className="hidden rounded-full border border-[#E8E8ED] px-2 py-0.5 font-mono text-[10px] font-normal text-[#6E6E73] sm:block">
              v0.1
            </span>
          </a>

          <nav
            className="hidden items-center gap-1 md:flex"
            onMouseLeave={() => setHovered(null)}
          >
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onMouseEnter={() => setHovered(link.label)}
                className="relative rounded-full px-3.5 py-1.5 text-sm text-[#6E6E73] transition-colors hover:text-[#1D1D1F]"
              >
                <AnimatePresence>
                  {hovered === link.label && (
                    <motion.span
                      layoutId="nav-pill"
                      transition={SPRING.snappy}
                      className="absolute inset-0 rounded-full bg-[#F5F5F7]"
                    />
                  )}
                </AnimatePresence>
                <span className="relative">{link.label}</span>
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <MagneticButton href="#cta" className="hidden px-4 py-1.5 text-sm sm:inline-flex">
              Get Started
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </MagneticButton>

            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid size-9 place-items-center rounded-full border border-[#E8E8ED] bg-white md:hidden"
            >
              <span className="relative block h-3.5 w-4">
                <motion.span
                  animate={open ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                  transition={SPRING.snappy}
                  className="absolute left-0 top-0 h-[1.5px] w-4 bg-[#1D1D1F]"
                />
                <motion.span
                  animate={open ? { opacity: 0 } : { opacity: 1 }}
                  transition={SPRING.snappy}
                  className="absolute left-0 top-[5px] h-[1.5px] w-4 bg-[#1D1D1F]"
                />
                <motion.span
                  animate={open ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                  transition={SPRING.snappy}
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
              transition={{ duration: 0.35, ease: EASE }}
              className="overflow-hidden rounded-b-[24px] border-t border-[#E8E8ED] bg-white md:hidden"
            >
              <div className="space-y-1 px-6 py-4">
                {LINKS.map((link, index) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + index * 0.045, ease: EASE }}
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-[15px] hover:bg-[#F5F5F7]"
                  >
                    {link.label}
                    <ArrowRight className="size-4 text-[#6E6E73]" />
                  </motion.a>
                ))}
                <MagneticButton href="#cta" className="mt-2 w-full" onClick={() => setOpen(false)}>
                  Get Started
                  <ArrowRight className="size-4" />
                </MagneticButton>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.header>
  );
}

/* ============================================================================
 * HERO
 * ========================================================================== */

function Hero() {
  const reduced = useReducedMotion();
  const install = "bun add @ragx/sdk";
  const { copied, copy } = useCopy(install);
  const words = ["The", "retrieval", "layer", "for", "your", "AI", "applications."];

  return (
    <section id="top" className="relative flex min-h-[850px] items-center overflow-hidden pt-28">
      <Blueprint />

      <div className="relative mx-auto w-full max-w-6xl px-6 pb-24 text-center">
        <motion.div variants={stagger} initial={reduced ? false : "hidden"} animate="visible">
          <motion.div variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E8E8ED] bg-white/80 px-3.5 py-1.5 text-[13px] text-[#6E6E73] shadow-[0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur">
              <motion.span
                animate={{ scale: [1, 1.45, 1], opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="size-1.5 rounded-full bg-[#0071E3]"
              />
              RAG infrastructure for developers
              <span className="font-mono text-[#E8E8ED]">/</span>
              <span className="font-mono text-[#1D1D1F]">v0.1</span>
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={0.08}
            className="mx-auto mt-8 max-w-5xl text-[48px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[76px] lg:text-[92px]"
          >
            {words.map((word, index) => (
              <motion.span
                key={`${word}-${index}`}
                initial={reduced ? false : { opacity: 0, y: 28, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.18 + index * 0.045, duration: 0.8, ease: EASE }}
                className={cn(
                  "mr-[0.22em] inline-block",
                  word === "retrieval" && "font-serif font-medium italic tracking-[-0.035em]",
                )}
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={0.2}
            className="mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-[#6E6E73] sm:text-[18px]"
          >
            Parse documents, create meaningful chunks, generate embeddings, and retrieve the right context — without rebuilding the RAG pipeline yourself.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={0.27}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <MagneticButton href="#cta">
              Get Started
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </MagneticButton>
            <a href="#code" className="group flex items-center gap-1 px-2 py-3 text-[15px] font-medium text-[#0071E3]">
              Read the Docs
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>

          <motion.button
            variants={fadeUp}
            custom={0.34}
            onClick={copy}
            className="group mx-auto mt-7 flex items-center gap-3 rounded-xl border border-[#E8E8ED] bg-white px-4 py-2.5 font-mono text-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#1D1D1F]/20 hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)]"
          >
            <Terminal className="size-3.5 text-[#6E6E73]" />
            <span>{install}</span>
            <span className="flex items-center gap-1 text-[#6E6E73]">
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span key="copied" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                    copied
                  </motion.span>
                ) : (
                  <motion.span key="copy" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-1">
                    <Copy className="size-3.5" />
                    copy
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </motion.button>

          <motion.div
            variants={fadeUp}
            custom={0.42}
            className="mx-auto mt-10 flex max-w-xl flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-xs text-[#6E6E73]"
          >
            <span>6 pipeline stages</span>
            <span className="hidden h-3 w-px bg-[#E8E8ED] sm:block" />
            <span>PDF · MD · DOCX · HTML · CSV</span>
            <span className="hidden h-3 w-px bg-[#E8E8ED] sm:block" />
            <span>pgvector</span>
          </motion.div>
        </motion.div>

        <HeroOrb />
      </div>
    </section>
  );
}

function HeroOrb() {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.7, duration: 1.2, ease: EASE }}
      className="relative mx-auto mt-20 h-16 max-w-2xl"
    >
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[#0071E3]/25 to-transparent" />
      <motion.div
        animate={reduced ? undefined : { x: ["-10%", "110%"] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-[#0071E3] shadow-[0_0_18px_rgba(0,113,227,0.65)]"
      />
      <div className="absolute left-1/2 top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#0071E3]/20 bg-white shadow-[0_0_0_8px_rgba(0,113,227,0.035)]">
        <span className="size-1.5 rounded-full bg-[#0071E3]" />
      </div>
    </motion.div>
  );
}

/* ============================================================================
 * PIPELINE STRIP
 * ========================================================================== */

function PipelineStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 85%", "end 30%"],
  });
  const reduced = useReducedMotion();
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const signalX = useTransform(progress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={ref} aria-label="RAGX pipeline" className="mx-auto max-w-6xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-2xl border border-[#E8E8ED] bg-white px-6 py-9 sm:px-10">
        <div className="absolute inset-x-10 top-[58px] hidden h-px bg-[#E8E8ED] sm:block" />
        <motion.div
          style={reduced ? undefined : { scaleX: progress }}
          className="absolute left-10 right-10 top-[58px] hidden h-px origin-left bg-[#0071E3] sm:block"
        />
        <motion.div
          style={reduced ? undefined : { left: signalX }}
          className="absolute top-[54px] hidden size-[9px] -translate-x-1/2 rounded-full bg-[#0071E3] shadow-[0_0_16px_rgba(0,113,227,0.55)] sm:block"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
          {PIPELINE.map((stage, index) => (
            <PipelineNode key={stage} stage={stage} index={index} progress={progress} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PipelineNode({
  stage,
  index,
  progress,
}: {
  stage: string;
  index: number;
  progress: MotionValue<number>;
}) {
  const reduced = useReducedMotion();
  const active = useTransform(progress, [index / PIPELINE.length, (index + 1) / PIPELINE.length], [0, 1]);
  const scale = useTransform(active, [0, 1], [0.94, 1]);
  const isLast = index === PIPELINE.length - 1;

  return (
    <div className="flex flex-1 items-center gap-3 sm:flex-col sm:gap-3 sm:text-center">
      <motion.div
        style={reduced ? undefined : { scale }}
        className={cn(
          "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border font-mono text-[11px]",
          isLast ? "border-[#0071E3] bg-[#0071E3] text-white" : "border-[#E8E8ED] bg-white text-[#1D1D1F]",
        )}
      >
        {index + 1}
      </motion.div>
      <span className={cn("font-mono text-[13px]", isLast ? "font-semibold text-[#0071E3]" : "text-[#1D1D1F]")}>
        {stage}
      </span>
    </div>
  );
}

/* ============================================================================
 * PRODUCT VISUAL
 * ========================================================================== */

function ProductVisual() {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(() => setActive((v) => (v + 1) % 3), 3600);
    return () => window.clearInterval(timer);
  }, [reduced]);

  return (
    <section className="mx-auto max-w-6xl px-6 pb-28">
      <Reveal>
        <div className="overflow-hidden rounded-2xl border border-[#E8E8ED] bg-white shadow-[0_20px_80px_rgba(0,0,0,0.045)]">
          <div className="flex items-center justify-between border-b border-[#E8E8ED] bg-[#F5F5F7] px-5 py-3">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#D7D7DC]" />
              <span className="size-2.5 rounded-full bg-[#D7D7DC]" />
              <span className="size-2.5 rounded-full bg-[#D7D7DC]" />
              <span className="ml-3 font-mono text-xs text-[#6E6E73]">ragx — pipeline</span>
            </div>
            <div className="hidden gap-1.5 sm:flex">
              {["Documents", "Pipeline", "Context"].map((label, index) => (
                <button
                  key={label}
                  onClick={() => setActive(index)}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors",
                    active === index ? "bg-[#1D1D1F] text-white" : "text-[#6E6E73] hover:text-[#1D1D1F]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-3">
            <DocumentPane active={active} onClick={() => setActive(0)} />
            <PipelinePane active={active} onClick={() => setActive(1)} />
            <ContextPane active={active} onClick={() => setActive(2)} />
          </div>
        </div>
      </Reveal>
      <p className="mt-3 text-center font-mono text-xs text-[#6E6E73]">
        Live schematic — pipeline state cycles automatically.
      </p>
    </section>
  );
}

function DocumentPane({ active, onClick }: { active: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-6 text-left transition-colors md:border-r md:border-[#E8E8ED]",
        active === 0 ? "bg-[#0071E3]/[0.035]" : "bg-white",
      )}
    >
      <p className="font-mono text-xs uppercase tracking-wider text-[#6E6E73]">Documents</p>
      <div className="mt-4 space-y-2.5">
        {DOCUMENTS.map((file, index) => (
          <motion.div
            key={file}
            animate={{ opacity: active === 0 ? 1 : 0.58, x: active === 0 ? 0 : 2 }}
            transition={{ delay: active === 0 ? index * 0.08 : 0, ...SPRING.smooth }}
            className="flex items-center gap-2.5 rounded-lg border border-[#E8E8ED] bg-white px-3 py-2.5 font-mono text-[13px]"
          >
            <FileText className="size-3.5 shrink-0 text-[#6E6E73]" />
            {file}
          </motion.div>
        ))}
      </div>
    </button>
  );
}

function PipelinePane({ active, onClick }: { active: number; onClick: () => void }) {
  const stages = ["Parsing", "Chunking", "Embedding", "Indexing"];

  return (
    <button
      onClick={onClick}
      className={cn(
        "border-t border-[#E8E8ED] p-6 text-left transition-colors md:border-t-0 md:border-r",
        active === 1 ? "bg-[#0071E3]/[0.035]" : "bg-white",
      )}
    >
      <p className="font-mono text-xs uppercase tracking-wider text-[#6E6E73]">RAGX Pipeline</p>
      <div className="mt-4 space-y-2.5">
        {stages.map((stage, index) => (
          <div
            key={stage}
            className="flex items-center justify-between rounded-lg border border-[#E8E8ED] bg-white px-3 py-2.5 text-[14px]"
          >
            <span>{stage}</span>
            <motion.span
              animate={
                active >= 1
                  ? { opacity: 1, scale: 1, backgroundColor: "#0071E3", borderColor: "#0071E3" }
                  : { opacity: 0.4, scale: 0.88, backgroundColor: "#fff", borderColor: "#E8E8ED" }
              }
              transition={{ delay: active === 1 ? 0.12 + index * 0.12 : 0, ...SPRING.snappy }}
              className="grid size-5 place-items-center rounded-full border"
            >
              <Check className="size-3 text-white" strokeWidth={3} />
            </motion.span>
          </div>
        ))}
      </div>
    </button>
  );
}

function ContextPane({ active, onClick }: { active: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "border-t border-[#E8E8ED] bg-[#F5F5F7]/70 p-6 text-left transition-colors md:border-t-0",
        active === 2 && "bg-[#0071E3]/[0.05]",
      )}
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
            animate={{ width: active === 2 ? "94%" : "12%" }}
            transition={{ duration: 0.9, ease: EASE }}
            className="h-full rounded-full bg-[#0071E3]"
          />
        </div>
      </div>
    </button>
  );
}

/* ============================================================================
 * THE BORING PART
 * ========================================================================== */

function BoringPart() {
  const without = ["Loader", "Parser", "Chunker", "Embedding provider", "Vector database", "Retrieval logic", "Metadata"];

  return (
    <section className="border-t border-[#E8E8ED] bg-[#F5F5F7]">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <Reveal className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-[46px] sm:leading-[1.05]">
            Stop rebuilding
            <br />
            the boring part of RAG.
          </h2>
          <p className="mt-5 text-[17px] leading-relaxed text-[#6E6E73]">
            Every AI application eventually needs to ingest documents, parse them, split them into useful chunks, generate embeddings, store vectors, and retrieve relevant context.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          <Reveal delay={0.1}>
            <div className="h-full rounded-2xl border border-[#E8E8ED] bg-white p-8">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-wider text-[#6E6E73]">Without RAGX</p>
                <span className="rounded-full bg-[#F5F5F7] px-2.5 py-1 font-mono text-[11px] text-[#6E6E73]">7 systems</span>
              </div>
              <div className="mt-7">
                {without.map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.055, ease: EASE }}
                  >
                    <p className="font-mono text-[14px] text-[#6E6E73]">{item}</p>
                    {index < without.length - 1 && <span className="my-1.5 ml-4 block h-3.5 w-px bg-[#E8E8ED]" />}
                  </motion.div>
                ))}
              </div>
              <p className="mt-7 border-t border-[#E8E8ED] pt-4 text-sm text-[#6E6E73]">You maintain everything.</p>
            </div>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="relative h-full overflow-hidden rounded-2xl border-2 border-[#0071E3]/25 bg-white p-8">
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-24 -top-24 size-56 rounded-full bg-[#0071E3]/10 blur-3xl"
              />
              <div className="relative flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-wider text-[#0071E3]">With RAGX</p>
                <span className="rounded-full bg-[#0071E3]/10 px-2.5 py-1 font-mono text-[11px] text-[#0071E3]">1 API</span>
              </div>
              <div className="relative mt-8 flex min-h-[248px] flex-col items-start justify-center">
                <FlowItem label="Documents" />
                <FlowLine />
                <motion.span
                  animate={{
                    boxShadow: [
                      "0 0 0 rgba(0,113,227,0)",
                      "0 0 30px rgba(0,113,227,0.2)",
                      "0 0 0 rgba(0,113,227,0)",
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="rounded-lg bg-[#0071E3] px-4 py-2 font-mono text-[15px] font-semibold text-white"
                >
                  RAGX
                </motion.span>
                <FlowLine />
                <FlowItem label="Relevant context" />
              </div>
              <p className="relative mt-7 border-t border-[#E8E8ED] pt-4 text-sm text-[#1D1D1F]">The pipeline is handled.</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function FlowItem({ label }: { label: string }) {
  return (
    <motion.span whileHover={{ x: 4 }} transition={SPRING.snappy} className="font-mono text-[15px]">
      {label}
    </motion.span>
  );
}

function FlowLine() {
  return (
    <div className="relative ml-6 h-8 w-px overflow-hidden bg-[#0071E3]/20">
      <motion.div
        animate={{ y: ["-100%", "400%"] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 h-3 w-full bg-[#0071E3]"
      />
    </div>
  );
}

/* ============================================================================
 * HOW IT WORKS
 * ========================================================================== */

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-[46px]">
            One pipeline.
            <br />
            Your stack.
          </h2>
          <p className="font-mono text-[13px] text-[#6E6E73]">src / pipeline.ts</p>
        </div>
      </Reveal>

      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[#E8E8ED] bg-[#E8E8ED] sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step, index) => (
          <Reveal key={step.n} delay={index * 0.045}>
            <motion.div
              whileHover={{ y: -3 }}
              transition={SPRING.smooth}
              className="group h-full bg-white p-7 transition-colors hover:bg-[#F5F5F7]"
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-[13px] text-[#0071E3]">{step.n}</p>
                <ArrowUpRight className="size-4 text-[#E8E8ED] transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#0071E3]" />
              </div>
              <h3 className="mt-4 text-[17px] font-semibold">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#6E6E73]">{step.desc}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.15}>
        <div className="mt-4 rounded-2xl border border-[#E8E8ED] p-8">
          <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <p className="max-w-sm text-[15px] leading-relaxed text-[#6E6E73]">
              RAGX does not lock developers into an LLM. Retrieval out, generation wherever you want.
            </p>
            <div className="font-mono text-[14px]">
              <p className="font-semibold">RAGX</p>
              <div className="ml-1 mt-2 space-y-1.5 border-l-2 border-[#0071E3]/25 pl-5">
                {["OpenAI", "Anthropic", "Gemini", "Mistral", "Your own model"].map((provider) => (
                  <p key={provider}>
                    <span className="mr-2 text-[#E8E8ED]">├──</span>
                    {provider}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ============================================================================
 * DEVELOPER EXPERIENCE
 * ========================================================================== */

type Tab = "ingest" | "retrieve";

const SNIPPETS: Record<Tab, string[]> = {
  ingest: ["const result = await ragx.documents.ingest(", '  "./manual.pdf"', ");"],
  retrieve: ["const context = await ragx.retrieve({", '  query: "How does authentication work?"', "});"],
};

function highlightLine(line: string) {
  const parts = line.split('"');
  if (parts.length < 3) return line;
  return (
    <>
      {parts[0]}
      <span className="text-[#4aa3ff]">&quot;{parts[1]}&quot;</span>
      {parts.slice(2).join('"')}
    </>
  );
}

function DevExperience() {
  const [tab, setTab] = useState<Tab>("ingest");
  const code = SNIPPETS[tab].join("\n");
  const { copied, copy } = useCopy(code);

  return (
    <section id="code" className="relative overflow-hidden bg-[#0A0A0C] py-28 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#0071E3]/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Developer experience</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-[46px] sm:leading-[1.05]">
              From document to context
              <br />
              in a few lines.
            </h2>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_30px_100px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <div className="flex gap-1.5">
                  {(["ingest", "retrieve"] as Tab[]).map((item) => (
                    <button
                      key={item}
                      onClick={() => setTab(item)}
                      className={cn(
                        "rounded-md px-3 py-1.5 font-mono text-xs transition-colors",
                        tab === item ? "bg-white text-black" : "text-white/50 hover:text-white",
                      )}
                    >
                      {item}.ts
                    </button>
                  ))}
                </div>
                <button onClick={copy} className="flex items-center gap-1.5 font-mono text-xs text-white/40 transition-colors hover:text-white">
                  <Copy className="size-3.5" />
                  {copied ? "copied" : "copy"}
                </button>
              </div>
              <pre className="overflow-x-auto p-6 font-mono text-[13.5px] leading-[1.8]">
                <code>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {code.split("\n").map((line, index) => (
                        <div key={`${tab}-${index}`} className="flex gap-4">
                          <span className="w-4 shrink-0 select-none text-right text-white/20">{index + 1}</span>
                          <span className={line.includes('"') ? "text-white/90" : "text-white/75"}>
                            {highlightLine(line)}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                  <motion.span
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="ml-8 mt-1 inline-block h-4 w-[7px] bg-[#0071E3]"
                  />
                </code>
              </pre>
            </div>
          </Reveal>
          <Reveal delay={0.16}>
            <ResponseVisual />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ResponseVisual() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((v) => (v + 1) % RETRIEVAL_RESULTS.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, []);

  const result = RETRIEVAL_RESULTS[active];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
      <div className="border-b border-white/10 px-5 py-3 font-mono text-xs text-white/40">response.json</div>
      <div className="p-6">
        <div className="font-mono text-[13.5px] leading-[1.9] text-white/70">
          <p>{"{"}</p>
          <p className="pl-4">chunks: [</p>
          <motion.div layout className="my-3 rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-center justify-between">
              <span className="text-white/40">chunk {result.id}</span>
              <motion.span
                key={result.score}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={SPRING.snappy}
                className="text-[#4aa3ff]"
              >
                {result.score.toFixed(2)}
              </motion.span>
            </div>
            <motion.p
              key={result.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-3 text-white"
            >
              {result.title}
            </motion.p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                animate={{ width: `${result.score * 100}%` }}
                transition={{ duration: 0.8, ease: EASE }}
                className="h-full rounded-full bg-[#0071E3]"
              />
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-white/35">
              <span>page {result.page}</span>
              <span>semantic match</span>
            </div>
          </motion.div>
          <p className="pl-4">]</p>
          <p>{"}"}</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * INTERACTIVE RETRIEVAL DEMO
 * ========================================================================== */

function RetrievalDemo() {
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const run = () => {
    if (running) return;
    setRunning(true);
    setDone(false);
    window.setTimeout(() => {
      setRunning(false);
      setDone(true);
    }, 1900);
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#6E6E73]">See retrieval happen</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-[46px]">Ask the pipeline.</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#6E6E73]">
            Not a chatbot. A visual explanation of what your retrieval layer actually does.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-[#E8E8ED] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.06)]">
          <div className="border-b border-[#E8E8ED] bg-[#F5F5F7] px-5 py-3 font-mono text-xs text-[#6E6E73]">
            ragx / retrieval
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6E6E73]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") run();
                  }}
                  placeholder="How does authentication work?"
                  className="h-12 w-full rounded-xl border border-[#E8E8ED] bg-white pl-11 pr-4 text-[14px] outline-none transition-shadow placeholder:text-[#A1A1A6] focus:border-[#0071E3]/40 focus:ring-4 focus:ring-[#0071E3]/[0.07]"
                />
              </div>
              <motion.button
                onClick={run}
                whileTap={{ scale: 0.97 }}
                className="h-12 rounded-xl bg-[#0071E3] px-6 text-sm font-medium text-white transition-colors hover:bg-[#0077ED]"
              >
                {running ? "Retrieving…" : "Retrieve"}
              </motion.button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Query embedding", "Vector search", "Context ranking"].map((stage, index) => (
                <RetrievalStage key={stage} title={stage} active={running || done} delay={index * 0.22} />
              ))}
            </div>

            <AnimatePresence>
              {(running || done) && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: 10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={SPRING.smooth}
                  className="mt-5 overflow-hidden"
                >
                  <div className="rounded-xl border border-[#E8E8ED] bg-[#F5F5F7]/70 p-5">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="text-[#6E6E73]">top result</span>
                      <span className="text-[#0071E3]">0.94</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Authentication</p>
                        <p className="mt-1 text-sm text-[#6E6E73]">
                          JWT tokens are issued on login and verified per request…
                        </p>
                      </div>
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={done ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0.4 }}
                        transition={SPRING.snappy}
                        className="hidden size-9 place-items-center rounded-full bg-[#0071E3] text-white sm:grid"
                      >
                        <Check className="size-4" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function RetrievalStage({ title, active, delay }: { title: string; active: boolean; delay: number }) {
  return (
    <motion.div
      animate={active ? { borderColor: "rgba(0,113,227,0.3)", backgroundColor: "rgba(0,113,227,0.035)" } : {}}
      transition={{ delay, duration: 0.35 }}
      className="rounded-xl border border-[#E8E8ED] p-4"
    >
      <div className="flex items-center gap-3">
        <motion.span
          animate={active ? { scale: [0.8, 1, 0.9], opacity: [0.4, 1, 0.5] } : {}}
          transition={{ duration: 0.9, repeat: active ? Infinity : 0 }}
          className="size-2 rounded-full bg-[#0071E3]"
        />
        <span className="font-mono text-[13px]">{title}</span>
      </div>
    </motion.div>
  );
}

/* ============================================================================
 * DOCUMENT UNDERSTANDING
 * ========================================================================== */

function DocUnderstanding() {
  const blocks = ["Heading", "Paragraph", "Table", "Image", "Code"];

  return (
    <section className="border-y border-[#E8E8ED] bg-[#F5F5F7]">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <Reveal className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-[46px]">
            Documents aren&apos;t
            <br />
            just text.
          </h2>
          <p className="mt-5 text-[17px] leading-relaxed text-[#6E6E73]">
            Real-world documents are messy. RAGX decomposes them into structured elements before they ever become chunks.
          </p>
        </Reveal>

        <div className="mt-12 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <Reveal delay={0.05}>
            <DocCard title="Input" className="bg-white">
              <div className="flex flex-wrap gap-2">
                {["Text", "Tables", "Images", "Code", "Headings", "Lists", "Scanned pages"].map((item) => (
                  <span key={item} className="rounded-full bg-[#F5F5F7] px-3 py-1.5 text-[13px]">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2.5 rounded-lg border border-[#E8E8ED] px-3 py-2.5 font-mono text-[13px]">
                <FileText className="size-4 text-[#0071E3]" />
                report.pdf
              </div>
            </DocCard>
          </Reveal>

          <div className="hidden items-center justify-center font-mono text-[#D5D5DA] lg:flex">
            <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
              →
            </motion.span>
          </div>

          <Reveal delay={0.12}>
            <DocCard title="Structured" className="bg-[#F5F5F7]">
              <div className="space-y-1.5">
                {blocks.map((block, index) => (
                  <motion.p
                    key={block}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + index * 0.08, ease: EASE }}
                    className="flex items-center gap-2 rounded-md border border-[#E8E8ED] bg-white px-3 py-1.5 font-mono text-[13px]"
                  >
                    <span className="size-1.5 rounded-full bg-[#0071E3]" />
                    {block}
                  </motion.p>
                ))}
              </div>
            </DocCard>
          </Reveal>

          <div className="hidden items-center justify-center font-mono text-[#D5D5DA] lg:flex">
            <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.5 }}>
              →
            </motion.span>
          </div>

          <Reveal delay={0.19}>
            <DocCard title="Chunks" dark>
              {[0.94, 0.89, 0.81].map((score, index) => (
                <motion.div
                  key={score}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25 + index * 0.12, ease: EASE }}
                  className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3.5"
                >
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-white/40">chunk 0{index + 42}</span>
                    <span className="text-[#4aa3ff]">{score.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: "4%" }}
                      whileInView={{ width: `${score * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.35 + index * 0.12, duration: 0.8, ease: EASE }}
                      className="h-full rounded-full bg-[#0071E3]"
                    />
                  </div>
                </motion.div>
              ))}
            </DocCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function DocCard({
  title,
  children,
  dark = false,
  className,
}: {
  title: string;
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-full rounded-2xl border p-7",
        dark ? "border-[#1D1D1F] bg-[#1D1D1F] text-white" : "border-[#E8E8ED]",
        className,
      )}
    >
      <p className={cn("font-mono text-xs uppercase tracking-wider", dark ? "text-white/40" : "text-[#6E6E73]")}>
        {title}
      </p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

/* ============================================================================
 * BYOK / BUILT FOR DEVS / CTA / FOOTER
 * ========================================================================== */

function Byok() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <Reveal className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-[46px]">
            Bring your own
            <br />
            model provider.
          </h2>
          <p className="mt-5 text-[17px] leading-relaxed text-[#6E6E73]">
            Your data pipeline shouldn&apos;t dictate which AI provider you use.
          </p>
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PROVIDERS.map((provider, index) => (
            <Reveal key={provider.name} delay={index * 0.06}>
              <motion.div
                whileHover={{ y: -5 }}
                transition={SPRING.smooth}
                className="group rounded-2xl border border-[#E8E8ED] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_15px_45px_rgba(0,0,0,0.07)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-semibold">{provider.name}</p>
                  <ChevronRight className="size-4 text-[#D0D0D5] transition-transform group-hover:translate-x-0.5 group-hover:text-[#0071E3]" />
                </div>
                <p className="mt-3 font-mono text-xs text-[#6E6E73]">{provider.key}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
        <p className="mt-7 font-mono text-[13px] text-[#1D1D1F]">Your keys. Your providers. Your control.</p>
      </div>
    </section>
  );
}

function BuiltForDevs() {
  const columns = [
    { title: "Provider agnostic", desc: "Use the embedding provider that fits your application." },
    { title: "Retrieval focused", desc: "RAGX handles the knowledge layer instead of becoming another chatbot." },
    { title: "Structured context", desc: "Retrieve useful chunks with metadata, scores, and document information." },
  ];

  return (
    <section className="border-t border-[#E8E8ED]">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-x-10 gap-y-10 md:grid-cols-3">
          {columns.map((column, index) => (
            <Reveal key={column.title} delay={index * 0.08}>
              <motion.div whileHover={{ y: -4 }} transition={SPRING.smooth} className="border-t-2 border-[#1D1D1F] pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[17px] font-semibold">{column.title}</h3>
                  <span className="font-mono text-xs text-[#0071E3]">0{index + 1}</span>
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-[#6E6E73]">{column.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section id="cta" className="border-t border-[#E8E8ED]">
      <div className="relative mx-auto max-w-6xl overflow-hidden px-6 py-32 text-center">
        <Blueprint />
        <Reveal className="relative">
          <h2 className="mx-auto max-w-3xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl sm:leading-[1.02]">
            Build the application.
            <br />
            Let RAGX handle retrieval.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-[#6E6E73]">
            Your AI application is the product. RAG infrastructure shouldn&apos;t be.
          </p>
          <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MagneticButton href="#top">
              Get Started
              <ArrowRight className="size-4" />
            </MagneticButton>
            <a href="#code" className="px-3 py-3 text-[15px] font-medium text-[#0071E3] hover:underline">
              Read the Docs
            </a>
          </div>
        </Reveal>
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
            <a href="#top" className="inline-flex items-center gap-2">
              <LogoMark size={22} />
              <span className="text-[17px] font-semibold tracking-[-0.02em]">RAGX</span>
            </a>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#6E6E73]">
              Retrieval infrastructure for AI applications.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[#6E6E73]">Product</p>
            <div className="mt-4 space-y-2.5 text-sm">
              {["Docs", "API", "Pricing"].map((item) => (
                <a key={item} href="#" className="block transition-colors hover:text-[#0071E3]">
                  {item}
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[#6E6E73]">Resources</p>
            <div className="mt-4 space-y-2.5 text-sm">
              {["GitHub", "Changelog", "Blog"].map((item) => (
                <a key={item} href="#" className="flex items-center gap-1.5 transition-colors hover:text-[#0071E3]">
                  {item}
                  {item === "GitHub" && <Github className="size-3.5" />}
                </a>
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
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen overflow-x-clip bg-white font-sans text-[#1D1D1F] antialiased selection:bg-[#0071E3]/15">
        <Nav />
        <Hero />
        <PipelineStrip />
        <ProductVisual />
        {/* <BoringPart /> */}
        <RagComparisonFlow/>
        <HowItWorks />
        <DevExperience />
        <RetrievalDemo />
        <DocUnderstanding />
        <Byok />
        {/* <PricingPage/> */}
        <BuiltForDevs />
        <FinalCta />
        <Footer />
      </main>
    </MotionConfig>
  );
}
