"use client";

import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { AlertTriangle, Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const TRADITIONAL = [
  { label: "Loader", status: "ok" as const },
  { label: "Parser", status: "warn" as const },
  { label: "Chunker", status: "ok" as const },
  { label: "Embeddings", status: "fail" as const },
  { label: "Vector DB", status: "warn" as const },
  { label: "Retriever", status: "ok" as const },
  { label: "Glue", status: "fail" as const },
];

const RAGX = [
  "Documents",
  "Parse",
  "Chunk",
  "Embed",
  "Retrieve",
  "Context",
];

const SPRING = {
  type: "spring" as const,
  stiffness: 240,
  damping: 26,
  mass: 0.65,
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function RagComparisonFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    once: false,
    margin: "-20%",
  });

  const reduced = useReducedMotion();

  const [tick, setTick] = useState(0);
  const [mode, setMode] = useState<"split" | "traditional" | "ragx">(
    "split",
  );

  useEffect(() => {
    if (!inView || reduced) return;

    const id = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(id);
  }, [inView, reduced]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-t border-[#E8E8ED] bg-white"
    >
      <div className="mx-auto max-w-6xl px-6 py-28">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A8A8F]">
              Live comparison
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.055em] text-[#1D1D1F] sm:text-[52px] sm:leading-[0.98]">
              Same destination.
              <br />
              <span className="text-[#A1A1A6]">
                Different motion.
              </span>
            </h2>
          </div>

          <div className="flex rounded-full border border-[#E8E8ED] bg-[#F7F7F8] p-1">
            {(["split", "traditional", "ragx"] as const).map(
              (item) => (
                <button
                  key={item}
                  onClick={() => setMode(item)}
                  className="relative rounded-full px-4 py-2 font-mono text-[10px] capitalize"
                >
                  {mode === item && (
                    <motion.span
                      layoutId="rag-mode"
                      className="absolute inset-0 rounded-full bg-[#1D1D1F]"
                      transition={SPRING}
                    />
                  )}

                  <span
                    className={cn(
                      "relative z-10",
                      mode === item
                        ? "text-white"
                        : "text-[#6E6E73]",
                    )}
                  >
                    {item}
                  </span>
                </button>
              ),
            )}
          </div>
        </div>

        <div
          className={cn(
            "mt-14 grid gap-5",
            mode === "split"
              ? "lg:grid-cols-2"
              : "grid-cols-1",
          )}
        >
          {(mode === "split" ||
            mode === "traditional") && (
            <TraditionalBoard
              tick={tick}
              reduced={!!reduced}
            />
          )}

          {(mode === "split" || mode === "ragx") && (
            <RagxBoard
              tick={tick}
              reduced={!!reduced}
            />
          )}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* TRADITIONAL                                                               */
/* ========================================================================== */

function TraditionalBoard({
  tick,
  reduced,
}: {
  tick: number;
  reduced: boolean;
}) {
  const step = tick % 10;
  const active = Math.min(step, 6);

  const broken = step >= 4 && step <= 7;

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-[#E8E8ED] bg-[#FAFAFB] p-6 sm:p-8">
      <Header
        eyebrow="Without RAGX"
        title="The route keeps changing."
        badge="fragile"
      />

      <div className="relative mt-8 h-[430px] overflow-hidden rounded-[24px] border border-[#E8E8ED] bg-white">
        <TraditionalField
          active={active}
          broken={broken}
          reduced={reduced}
        />

        {TRADITIONAL.map((node, i) => {
          const positions = [
            { x: "12%", y: "78%" },
            { x: "27%", y: "38%" },
            { x: "43%", y: "70%" },
            { x: "58%", y: "24%" },
            { x: "73%", y: "61%" },
            { x: "84%", y: "27%" },
            { x: "93%", y: "72%" },
          ];

          const p = positions[i];

          return (
            <motion.div
              key={node.label}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: p.x,
                top: p.y,
              }}
              animate={
                active === i && !reduced
                  ? {
                      x: [0, 2, -2, 0],
                      y: [0, -5, 0],
                    }
                  : {
                      x: 0,
                      y: 0,
                    }
              }
              transition={{
                duration: 0.8,
                repeat:
                  active === i && !reduced
                    ? Infinity
                    : 0,
              }}
            >
              <div
                className={cn(
                  "relative grid size-11 place-items-center rounded-2xl border bg-white shadow-[0_10px_35px_rgba(0,0,0,.06)]",
                  active === i &&
                    node.status === "fail"
                    ? "border-[#FF3B30]/40"
                    : active === i
                      ? "border-[#1D1D1F]/20"
                      : "border-[#E8E8ED]",
                )}
              >
                <Status
                  status={node.status}
                  active={active === i}
                />

                {active === i &&
                  !reduced && (
                    <motion.span
                      className="absolute inset-[-8px] rounded-[20px] border border-[#1D1D1F]/10"
                      animate={{
                        scale: [0.85, 1.25],
                        opacity: [0.8, 0],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                      }}
                    />
                  )}
              </div>

              <p className="mt-2 whitespace-nowrap text-center font-mono text-[9px] text-[#6E6E73]">
                {node.label}
              </p>
            </motion.div>
          );
        })}

        <MovingPacket
          type="traditional"
          active={active}
          broken={broken}
          reduced={reduced}
        />
      </div>

      <AnimatePresence mode="wait">
        {broken ? (
          <motion.div
            key="broken"
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            className="mt-4 flex items-center gap-3 rounded-2xl border border-[#FF3B30]/15 bg-[#FF3B30]/[0.04] px-4 py-3"
          >
            <div className="grid size-7 place-items-center rounded-lg bg-[#FF3B30]/10">
              <AlertTriangle className="size-3.5 text-[#FF3B30]" />
            </div>

            <div>
              <p className="font-mono text-[10px] text-[#B42318]">
                route corrupted
              </p>

              <p className="mt-0.5 text-[11px] text-[#8A8A8F]">
                dependency failed · signal is being rerouted
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="normal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex items-center justify-between rounded-2xl border border-[#E8E8ED] px-4 py-3"
          >
            <span className="font-mono text-[10px] text-[#8A8A8F]">
              moving through
            </span>

            <span className="font-mono text-[10px] text-[#1D1D1F]">
              {TRADITIONAL[active].label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ========================================================================== */
/* TRADITIONAL FIELD                                                         */
/* ========================================================================== */

function TraditionalField({
  active,
  broken,
  reduced,
}: {
  active: number;
  broken: boolean;
  reduced: boolean;
}) {
  /*
   * Completely different direction:
   *
   * bottom-left
   *      ↑
   *      └───────┐
   *              ↓
   *       ┌──────┘
   *       ↑
   *       └────────→
   */

  const mainPath = `
    M 70 335
    C 70 300 70 245 125 245
    C 185 245 175 110 235 110
    C 295 110 280 335 350 335
    C 420 335 395 65 470 65
    C 535 65 510 250 580 250
    C 645 250 625 105 700 105
  `;

  const progress = Math.min((active + 1) / 7, 1);

  return (
    <svg
      viewBox="0 0 760 430"
      className="absolute inset-0 size-full"
      fill="none"
      preserveAspectRatio="none"
    >
      <defs>
        <filter
          id="traditional-glow"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur
            stdDeviation="5"
            result="blur"
          />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ghost topology */}
      <path
        d={mainPath}
        stroke="#E8E8ED"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* moving route */}
      <motion.path
        d={mainPath}
        pathLength={1}
        stroke={broken ? "#FF3B30" : "#BFC0C5"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="0.012 0.025"
        animate={{
          pathLength: progress,
        }}
        transition={SPRING}
      />

      {/* FAILURE: route suddenly turns away */}
      <motion.path
        d="
          M 470 65
          C 530 25 630 25 680 175
          C 700 235 655 350 590 370
        "
        stroke="#FF3B30"
        strokeWidth="2"
        strokeDasharray="5 9"
        animate={
          broken && !reduced
            ? {
                pathLength: [0, 1, 0],
                opacity: [0.1, 0.9, 0.1],
              }
            : {
                pathLength: 0,
                opacity: 0.08,
              }
        }
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* chaotic reverse branch */}
      <motion.path
        d="
          M 580 250
          C 520 300 520 370 450 375
          C 390 380 390 320 350 335
        "
        stroke="#FF9F0A"
        strokeWidth="1.5"
        strokeDasharray="3 8"
        animate={
          broken && !reduced
            ? {
                pathLength: [0, 1],
                strokeDashoffset: [0, -30],
              }
            : {
                opacity: 0.08,
              }
        }
        transition={{
          duration: 1.3,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* route particles */}
      {!reduced &&
        [0, 1, 2, 3].map((i) => (
          <motion.circle
            key={i}
            r="2"
            fill={broken ? "#FF3B30" : "#8A8A8F"}
            filter="url(#traditional-glow)"
            animate={{
              cx: [70, 125, 235, 350, 470, 580, 700],
              cy: [335, 245, 110, 335, 65, 250, 105],
              opacity: [0, 1, 1, 1, 1, 0.5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.7,
              ease: "linear",
            }}
          />
        ))}
    </svg>
  );
}

/* ========================================================================== */
/* RAGX                                                                      */
/* ========================================================================== */

function RagxBoard({
  tick,
  reduced,
}: {
  tick: number;
  reduced: boolean;
}) {
  const step = tick % 8;
  const active = Math.min(step, 5);

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-[#0071E3]/20 bg-white p-6 shadow-[0_30px_90px_rgba(0,113,227,.07)] sm:p-8">
      <motion.div
        className="pointer-events-none absolute -right-48 -top-48 size-[550px] rounded-full bg-[#0071E3]/[0.07] blur-3xl"
        animate={
          reduced
            ? undefined
            : {
                scale: [1, 1.15, 1],
                opacity: [0.35, 0.7, 0.35],
              }
        }
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <Header
        eyebrow="With RAGX"
        title="The signal never loses direction."
        badge="continuous"
        accent
      />

      <div className="relative mt-8 h-[430px] overflow-hidden rounded-[24px] border border-[#0071E3]/10 bg-[#FBFDFF]">
        <RagxField
          active={active}
          reduced={reduced}
        />

        {RAGX.map((label, i) => {
          const positions = [
            { x: "10%", y: "75%" },
            { x: "28%", y: "28%" },
            { x: "45%", y: "72%" },
            { x: "62%", y: "25%" },
            { x: "79%", y: "67%" },
            { x: "94%", y: "32%" },
          ];

          const p = positions[i];

          return (
            <motion.div
              key={label}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: p.x,
                top: p.y,
              }}
              animate={
                active === i && !reduced
                  ? {
                      y: [0, -6, 0],
                      scale: [1, 1.07, 1],
                    }
                  : {
                      y: 0,
                      scale: 1,
                    }
              }
              transition={{
                duration: 0.9,
                repeat:
                  active === i && !reduced
                    ? Infinity
                    : 0,
              }}
            >
              <div className="relative grid size-11 place-items-center rounded-full border border-[#0071E3] bg-white shadow-[0_8px_35px_rgba(0,113,227,.13)]">
                {active >= i ? (
                  <Check
                    className="size-4 text-[#0071E3]"
                    strokeWidth={3}
                  />
                ) : (
                  <span className="font-mono text-[10px] text-[#8A8A8F]">
                    {i + 1}
                  </span>
                )}

                {active === i && !reduced && (
                  <motion.span
                    className="absolute inset-[-8px] rounded-full border border-[#0071E3]/25"
                    animate={{
                      scale: [0.8, 1.35],
                      opacity: [0.8, 0],
                    }}
                    transition={{
                      duration: 1.3,
                      repeat: Infinity,
                    }}
                  />
                )}
              </div>

              <p className="mt-2 whitespace-nowrap text-center font-mono text-[9px] text-[#0071E3]">
                {label}
              </p>
            </motion.div>
          );
        })}

        <RagxPacket
          active={active}
          reduced={reduced}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-[#E8E8ED] bg-[#F8FAFC] px-4 py-3">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span className="text-[#8A8A8F]">
            pipeline signal
          </span>

          <motion.span
            key={active}
            initial={{
              opacity: 0,
              x: 8,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            className="text-[#0071E3]"
          >
            {active === 5
              ? "CONTEXT READY · 0.94"
              : `${RAGX[active].toUpperCase()} · ACTIVE`}
          </motion.span>
        </div>

        <div className="relative mt-3 h-[2px] overflow-hidden rounded-full bg-[#E3EAF2]">
          <motion.div
            className="absolute inset-y-0 left-0 bg-[#0071E3]"
            animate={{
              width: `${((active + 1) / 6) * 100}%`,
            }}
            transition={SPRING}
          />

          {!reduced && (
            <motion.div
              className="absolute inset-y-0 w-16 bg-white/90 blur-sm"
              animate={{
                left: ["-20%", "120%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* RAGX FIELD                                                                */
/* ========================================================================== */

function RagxField({
  active,
  reduced,
}: {
  active: number;
  reduced: boolean;
}) {
  const path = `
    M 55 325
    C 75 270 95 255 150 255
    C 220 255 190 85 265 85
    C 340 85 305 325 385 325
    C 470 325 430 80 510 80
    C 595 80 555 270 635 270
    C 690 270 700 130 725 130
  `;

  return (
    <svg
      viewBox="0 0 760 430"
      className="absolute inset-0 size-full"
      fill="none"
      preserveAspectRatio="none"
    >
      <defs>
        <filter
          id="ragx-glow"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur
            stdDeviation="6"
            result="blur"
          />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* atmosphere */}
      <path
        d={path}
        stroke="#0071E3"
        strokeWidth="18"
        strokeLinecap="round"
        opacity="0.025"
      />

      {/* background route */}
      <path
        d={path}
        stroke="#DCE7F3"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* active route */}
      <motion.path
        d={path}
        pathLength={1}
        stroke="#0071E3"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="0.01 0.025"
        animate={{
          pathLength: Math.min((active + 1) / 6, 1),
        }}
        transition={SPRING}
      />

      {/* continuous energy stream */}
      {!reduced && (
        <>
          <motion.path
            d={path}
            stroke="#0071E3"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="1 38"
            opacity="0.32"
            filter="url(#ragx-glow)"
            animate={{
              strokeDashoffset: [0, -78],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <motion.path
            d={path}
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="0.01 0.06"
            animate={{
              strokeDashoffset: [0, -100],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* particles */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.circle
              key={i}
              r={i % 2 === 0 ? 2 : 1.5}
              fill="#0071E3"
              filter="url(#ragx-glow)"
              animate={{
                cx: [
                  55,
                  150,
                  265,
                  385,
                  510,
                  635,
                  725,
                ],
                cy: [
                  325,
                  255,
                  85,
                  325,
                  80,
                  270,
                  130,
                ],
                opacity: [
                  0,
                  0.9,
                  0.9,
                  0.9,
                  0.9,
                  0.9,
                  0,
                ],
              }}
              transition={{
                duration: 3.8,
                repeat: Infinity,
                delay: i * 0.55,
                ease: "linear",
              }}
            />
          ))}
        </>
      )}
    </svg>
  );
}

/* ========================================================================== */
/* PACKETS                                                                    */
/* ========================================================================== */

function MovingPacket({
  type,
  active,
  broken,
  reduced,
}: {
  type: "traditional";
  active: number;
  broken: boolean;
  reduced: boolean;
}) {
  const positions = [
    ["12%", "78%"],
    ["27%", "38%"],
    ["43%", "70%"],
    ["58%", "24%"],
    ["73%", "61%"],
    ["84%", "27%"],
    ["93%", "72%"],
  ];

  const [left, top] = positions[active];

  return (
    <motion.div
      className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
      animate={{
        left,
        top,
        rotate: broken ? [0, -15, 15, 0] : 0,
      }}
      transition={{
        left: SPRING,
        top: SPRING,
        rotate: {
          duration: 0.7,
          repeat: broken && !reduced ? Infinity : 0,
        },
      }}
    >
      <motion.div
        animate={{
          scale: broken
            ? [1, 1.3, 0.8, 1]
            : [1, 1.12, 1],
        }}
        transition={{
          duration: 0.8,
          repeat: reduced ? 0 : Infinity,
        }}
        className={cn(
          "size-3 rounded-full",
          broken
            ? "bg-[#FF3B30]"
            : "bg-[#1D1D1F]",
        )}
        style={{
          boxShadow: broken
            ? "0 0 25px rgba(255,59,48,.8)"
            : "0 0 18px rgba(0,0,0,.35)",
        }}
      />
    </motion.div>
  );
}

function RagxPacket({
  active,
  reduced,
}: {
  active: number;
  reduced: boolean;
}) {
  const positions = [
    ["10%", "75%"],
    ["28%", "28%"],
    ["45%", "72%"],
    ["62%", "25%"],
    ["79%", "67%"],
    ["94%", "32%"],
  ];

  const [left, top] = positions[active];

  return (
    <motion.div
      className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
      animate={{
        left,
        top,
      }}
      transition={{
        left: SPRING,
        top: SPRING,
      }}
    >
      <motion.div
        animate={{
          scale: [0.85, 1.2, 0.85],
        }}
        transition={{
          duration: 0.9,
          repeat: reduced ? 0 : Infinity,
        }}
        className="size-3 rounded-full bg-[#0071E3]"
        style={{
          boxShadow:
            "0 0 30px rgba(0,113,227,.95)",
        }}
      />

      {!reduced && (
        <>
          <motion.span
            className="absolute inset-[-7px] rounded-full border border-[#0071E3]/30"
            animate={{
              scale: [0.7, 1.8],
              opacity: [0.8, 0],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
            }}
          />

          <motion.span
            className="absolute inset-[-14px] rounded-full border border-[#0071E3]/10"
            animate={{
              scale: [0.8, 2],
              opacity: [0.4, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />
        </>
      )}
    </motion.div>
  );
}

/* ========================================================================== */
/* SHARED                                                                     */
/* ========================================================================== */

function Header({
  eyebrow,
  title,
  badge,
  accent = false,
}: {
  eyebrow: string;
  title: string;
  badge: string;
  accent?: boolean;
}) {
  return (
    <div className="relative flex items-start justify-between gap-5">
      <div>
        <p
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.2em]",
            accent
              ? "text-[#0071E3]"
              : "text-[#8A8A8F]",
          )}
        >
          {eyebrow}
        </p>

        <h3 className="mt-2 text-[19px] font-semibold tracking-[-0.03em] text-[#1D1D1F]">
          {title}
        </h3>
      </div>

      <span
        className={cn(
          "rounded-full px-3 py-1.5 font-mono text-[9px]",
          accent
            ? "bg-[#0071E3]/[0.08] text-[#0071E3]"
            : "bg-[#F2F2F4] text-[#6E6E73]",
        )}
      >
        {badge}
      </span>
    </div>
  );
}

function Status({
  status,
  active,
}: {
  status: "ok" | "warn" | "fail";
  active: boolean;
}) {
  const color =
    status === "fail"
      ? "#FF3B30"
      : status === "warn"
        ? "#FF9F0A"
        : "#34C759";

  return (
    <span className="relative grid size-5 place-items-center">
      <motion.span
        className="size-2 rounded-full"
        style={{
          backgroundColor: color,
        }}
        animate={
          active
            ? {
                scale: [0.7, 1.3, 1],
                opacity: [0.4, 1, 0.8],
              }
            : {
                scale: 0.75,
                opacity: 0.3,
              }
        }
        transition={{
          duration: 0.8,
          repeat: active ? Infinity : 0,
        }}
      />

      {status === "fail" && active && (
        <X
          className="absolute size-2.5"
          style={{
            color,
          }}
        />
      )}
    </span>
  );
}
