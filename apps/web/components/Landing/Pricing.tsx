"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  Database,
  ShieldCheck,
} from "lucide-react";

const plans = [
  {
    name: "Free",
    description: "Everything you need to build and experiment.",
    price: "$0",
    period: "forever",
    cta: "Start building",
    featured: false,
    features: [
      "1 project",
      "5,000 documents",
      "50,000 chunks",
      "100K API requests / month",
      "Semantic chunking",
      "Standard embeddings",
      "Community support",
    ],
  },
  {
    name: "Pro",
    description: "For production apps and growing workloads.",
    price: "$5",
    period: "per month",
    cta: "Start Pro",
    featured: true,
    features: [
      "Unlimited projects",
      "100,000 documents",
      "2M chunks",
      "2M API requests / month",
      "Advanced chunking",
      "Custom embedding models",
      "Hybrid search",
      "Metadata filtering",
      "Priority support",
    ],
  },
 
];

function PricingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#111]">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-280px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-blue-500/[0.045] blur-3xl" />

        <svg
          className="absolute inset-0 h-full w-full opacity-[0.035]"
          viewBox="0 0 1200 900"
          fill="none"
        >
          <defs>
            <pattern
              id="grid"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path d="M48 0H0V48" stroke="currentColor" />
            </pattern>
          </defs>

          <rect width="1200" height="900" fill="url(#grid)" />
        </svg>
      </div>

      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-24 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-medium text-black/55 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Simple, predictable pricing
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.95] tracking-[-0.065em]"
          >
            Ship RAG.
            <br />
            <span className="text-black/35">Not infrastructure.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="mx-auto mt-7 max-w-xl text-[17px] leading-7 text-black/50"
          >
            Start for free, scale when you need to. Pay for what your
            application actually uses — without managing the RAG stack
            yourself.
          </motion.p>
        </div>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 flex justify-center"
        >
          <div className="inline-flex rounded-full border border-black/[0.08] bg-black/[0.025] p-1 shadow-sm">
            <button className="rounded-full bg-white px-5 py-2 text-sm font-medium shadow-sm">
              Monthly
            </button>

            <button className="rounded-full px-5 py-2 text-sm font-medium text-black/40">
              Yearly
              <span className="ml-1.5 text-blue-600">save 20%</span>
            </button>
          </div>
        </motion.div>

        {/* Pricing */}
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.25 + index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -6 }}
              className={`group relative flex flex-col rounded-[28px] border p-7 transition-shadow duration-500 ${
                plan.featured
                  ? "border-blue-500/30 bg-white shadow-[0_20px_70px_-25px_rgba(37,99,235,0.3)]"
                  : "border-black/[0.08] bg-white/80 shadow-[0_10px_40px_-30px_rgba(0,0,0,0.25)]"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-7 rounded-full bg-[#111] px-3 py-1 text-[11px] font-semibold tracking-wide text-white">
                  MOST POPULAR
                </div>
              )}

              {/* top */}
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-[-0.02em]">
                    {plan.name}
                  </h2>

                  {plan.featured && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                      <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                </div>

                <p className="mt-2 min-h-[48px] text-sm leading-6 text-black/45">
                  {plan.description}
                </p>
              </div>

              {/* price */}
              <div className="mt-8">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-[-0.06em]">
                    {plan.price}
                  </span>

                  {plan.price !== "Custom" && (
                    <span className="mb-1.5 text-sm text-black/35">
                      / {plan.period}
                    </span>
                  )}
                </div>

                {plan.price === "Custom" && (
                  <p className="mt-2 text-xs text-black/35">
                    Built around your workload
                  </p>
                )}
              </div>

              {/* CTA */}
              <button
                className={`mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  plan.featured
                    ? "bg-[#111] text-white hover:bg-blue-600"
                    : "border border-black/[0.09] bg-white text-black hover:border-black/20 hover:bg-black/[0.025]"
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>

              {/* divider */}
              <div className="my-8 h-px bg-black/[0.07]" />

              {/* features */}
              <div className="flex-1">
                <p className="mb-5 text-xs font-semibold uppercase tracking-[0.12em] text-black/35">
                  Includes
                </p>

                <div className="space-y-3.5">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 text-sm text-black/65"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50">
                        <Check className="h-3 w-3 text-blue-600" />
                      </div>

                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Usage strip */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mt-6 grid overflow-hidden rounded-[28px] border border-black/[0.08] bg-[#fafafa] sm:grid-cols-3"
        >
          {[
            {
              icon: Database,
              title: "Your data",
              text: "Your documents stay yours.",
            },
            {
              icon: Zap,
              title: "Usage based",
              text: "Scale without infrastructure limits.",
            },
            {
              icon: ShieldCheck,
              title: "Production ready",
              text: "Built for real applications.",
            },
          ].map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className={`flex items-center gap-4 p-6 ${
                  index !== 0 ? "border-t sm:border-l sm:border-t-0" : ""
                } border-black/[0.07]`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/[0.07] bg-white">
                  <Icon className="h-4 w-4 text-black/55" />
                </div>

                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs text-black/40">
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto mt-24 max-w-2xl text-center"
        >
          <p className="text-sm text-black/35">
            Need something different?
          </p>

          <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
            Let's build around your workload.
          </h3>

          <button className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">
            Talk to the team
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </section>
    </main>
  );
}

export default PricingPage;
