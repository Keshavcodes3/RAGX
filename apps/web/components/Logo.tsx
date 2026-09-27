"use client";

import { motion } from "framer-motion";

export function LogoMark({
  size = 32,
  animated = true,
}: {
  size?: number;
  animated?: boolean;
}) {
  const MotionRect = animated ? motion.rect : "rect";
  const MotionPath = animated ? motion.path : "path";
  const MotionCircle = animated ? motion.circle : "circle";

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="RAGX logo"
      initial={animated ? "rest" : false}
      whileHover={animated ? "active" : undefined}
      animate={animated ? "rest" : undefined}
    >
      <defs>
        <linearGradient
          id="ragx-active"
          x1="7"
          y1="16"
          x2="27"
          y2="16"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#0071E3" />
          <stop offset="1" stopColor="#5AC8FA" />
        </linearGradient>

        <filter
          id="ragx-glow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <clipPath id="ragx-tile">
          <rect
            x="1"
            y="1"
            width="30"
            height="30"
            rx="9"
          />
        </clipPath>
      </defs>

      {/* ─────────────────────────────────────────
          Precision container
      ────────────────────────────────────────── */}
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="9"
        fill="#1D1D1F"
      />

      {/* Subtle inner highlight */}
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="8.5"
        stroke="white"
        strokeOpacity="0.08"
      />

      <g clipPath="url(#ragx-tile)">
        {/* ─────────────────────────────────────
            Context layer 01
        ────────────────────────────────────── */}
        <MotionRect
          x="7"
          y="8"
          width="14"
          height="3"
          rx="1.5"
          fill="white"
          opacity="0.28"
          variants={{
            rest: {
              x: 7,
              opacity: 0.28,
            },
            active: {
              x: 5,
              opacity: 0.18,
              transition: {
                duration: 0.45,
                ease: "easeOut",
              },
            },
          }}
        />

        {/* ─────────────────────────────────────
            Context layer 02
            THE RETRIEVED CHUNK
        ────────────────────────────────────── */}
        <MotionRect
          x="7"
          y="14.5"
          width="18"
          height="3"
          rx="1.5"
          fill="url(#ragx-active)"
          filter="url(#ragx-glow)"
          variants={{
            rest: {
              x: 7,
              width: 18,
              scaleX: 1,
              transformOrigin: "7px 16px",
            },
            active: {
              x: 5,
              width: 21,
              scaleX: 1.08,
              transformOrigin: "5px 16px",
              transition: {
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              },
            },
          }}
        />

        {/* ─────────────────────────────────────
            Context layer 03
        ────────────────────────────────────── */}
        <MotionRect
          x="7"
          y="21"
          width="12"
          height="3"
          rx="1.5"
          fill="white"
          opacity="0.28"
          variants={{
            rest: {
              x: 7,
              opacity: 0.28,
            },
            active: {
              x: 5,
              opacity: 0.18,
              transition: {
                duration: 0.45,
                ease: "easeOut",
              },
            },
          }}
        />

        {/* ─────────────────────────────────────
            Retrieval beam
        ────────────────────────────────────── */}
        <MotionPath
          d="M25 16H29"
          stroke="#0071E3"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0"
          variants={{
            rest: {
              x: -4,
              opacity: 0,
            },
            active: {
              x: 0,
              opacity: [0, 0.5, 1, 0],
              transition: {
                duration: 0.65,
                times: [0, 0.25, 0.5, 1],
                ease: "easeOut",
              },
            },
          }}
        />

        {/* ─────────────────────────────────────
            The X
            Two retrieval vectors cross around
            the selected context.
        ────────────────────────────────────── */}
        <MotionPath
          d="M20 10.5L25.5 16L20 21.5"
          stroke="url(#ragx-active)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={{
            rest: {
              pathLength: 1,
              opacity: 0.9,
              x: 0,
              scale: 1,
            },
            active: {
              pathLength: [0, 1],
              opacity: [0, 1, 1],
              x: 0.5,
              scale: [0.85, 1.08, 1],
              transition: {
                pathLength: {
                  duration: 0.45,
                  ease: "easeOut",
                },
                opacity: {
                  duration: 0.2,
                },
                scale: {
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            },
          }}
        />

        {/* Retrieval point */}
        <MotionCircle
          cx="25.5"
          cy="16"
          r="1.35"
          fill="#5AC8FA"
          variants={{
            rest: {
              scale: 0.85,
              opacity: 0.85,
            },
            active: {
              scale: [0.85, 1.5, 0.85],
              opacity: [0.85, 1, 0.85],
              transition: {
                duration: 0.6,
                ease: "easeInOut",
              },
            },
          }}
        />
      </g>
    </motion.svg>
  );
}

export function Logo({
  size = 32,
  className = "",
  wordmark = true,
  animated = true,
}: {
  size?: number;
  className?: string;
  wordmark?: boolean;
  animated?: boolean;
}) {
  return (
    <motion.span
      className={`inline-flex items-center gap-2.5 ${className}`}
      initial="rest"
      whileHover="active"
    >
      <LogoMark
        size={size}
        animated={animated}
      />

      {wordmark && (
        <motion.span
          className="text-[18px] font-semibold tracking-[-0.04em] text-[#1D1D1F]"
          variants={{
            rest: {
              letterSpacing: "-0.04em",
            },
            active: {
              letterSpacing: "-0.025em",
            },
          }}
          transition={{
            duration: 0.35,
            ease: "easeOut",
          }}
        >
          RAGX
        </motion.span>
      )}
    </motion.span>
  );
}
