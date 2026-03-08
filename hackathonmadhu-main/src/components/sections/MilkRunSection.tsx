"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Route, Truck } from "lucide-react";

import { FadeIn } from "@/components/animations/FadeIn";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

function RouteVisual({ optimized }: { optimized: boolean }) {
  const nodes = [
    { left: "11%", top: "24%" },
    { left: "28%", top: "66%" },
    { left: "51%", top: "32%" },
    { left: "72%", top: "62%" },
    { left: "86%", top: "40%" },
  ];

  return (
    <div className="relative h-72 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.12))] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(51,204,179,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(201,240,163,0.14),transparent_34%)]" />

      {nodes.map((node, index) => (
        <div
          key={index}
          className="absolute h-3.5 w-3.5 rounded-full bg-[#dff8bc] ring-4 ring-[#dff8bc]/10"
          style={{ left: node.left, top: node.top }}
        />
      ))}

      <div className="absolute bottom-9 left-[46%] flex -translate-x-1/2 flex-col items-center gap-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#33ccb3] text-[#062017] shadow-[0_10px_24px_rgba(51,204,179,0.28)]">
          <Truck className="h-5 w-5" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#dff8bc]">Mandi hub</span>
      </div>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 288">
        {optimized ? (
          <>
            <motion.path
              d="M 46 62 L 118 180 L 205 92 L 288 172 L 346 110 L 196 235"
              fill="none"
              stroke="#9ff0d8"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1 }}
            />
            <circle r="4" fill="#dff8bc" style={{ filter: "drop-shadow(0 0 8px #9ff0d8)" }}>
              <animateMotion
                dur="3.2s"
                repeatCount="indefinite"
                path="M 46 62 L 118 180 L 205 92 L 288 172 L 346 110 L 196 235"
              />
            </circle>
          </>
        ) : (
          <>
            {[
              "M 46 62 L 196 235",
              "M 118 180 L 196 235",
              "M 205 92 L 196 235",
              "M 288 172 L 196 235",
              "M 346 110 L 196 235",
            ].map((path, index) => (
              <motion.path
                key={index}
                d={path}
                fill="none"
                stroke="rgba(255,255,255,0.24)"
                strokeWidth="1.8"
                strokeDasharray="6 5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.72 }}
                transition={{ duration: 0.7, delay: index * 0.08 }}
              />
            ))}
          </>
        )}
      </svg>
    </div>
  );
}

export function MilkRunSection() {
  const [showDetails, setShowDetails] = useState(false);
  const [showOptimized, setShowOptimized] = useState(true);

  return (
    <section className="relative py-24 md:py-28">
      <Container>
        <div className="landing-section-shell rounded-[1.9rem] px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
          <div className="relative z-10">
            <SectionHeading
              eyebrow="Logistics"
              title="Make transport viable with shared routing instead of isolated trips"
              subtitle="Milk-run planning converts transport from an afterthought into a margin-protection layer for farmers and buyers."
              align="left"
              className="mb-12"
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
              <FadeIn>
                <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,24,18,0.88),rgba(7,17,14,0.9))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
                  <div className="mb-5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowOptimized(false)}
                      className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                        !showOptimized
                          ? "border border-white/10 bg-white/10 text-white"
                          : "border border-transparent bg-transparent text-white/55"
                      }`}
                    >
                      Separate trips
                    </button>
                    <ArrowRight className="h-4 w-4 text-white/35" />
                    <button
                      type="button"
                      onClick={() => setShowOptimized(true)}
                      className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                        showOptimized
                          ? "border border-[#d8f8b0]/25 bg-[#33ccb3]/12 text-white"
                          : "border border-transparent bg-transparent text-white/55"
                      }`}
                    >
                      Milk-run route
                    </button>
                  </div>

                  <RouteVisual optimized={showOptimized} />

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[1.3rem] border border-white/8 bg-black/18 px-4 py-4 text-sm">
                    <p className="text-white/62">
                      {showOptimized
                        ? "One consolidated route with better truck utilization and fewer empty kilometers."
                        : "Multiple trucks running overlapping village-to-mandi trips."}
                    </p>
                    <p className="font-semibold text-[#dff8bc]">
                      {showOptimized ? "Up to 40% lower transport cost" : "Baseline transport cost"}
                    </p>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.08}>
                <div className="space-y-5">
                  <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(160deg,rgba(7,25,20,0.92),rgba(55,71,18,0.52))] p-6">
                    <div className="flex items-center gap-3 text-[#dff8bc]">
                      <Route className="h-5 w-5" />
                      <p className="text-xs font-bold uppercase tracking-[0.22em]">Why this matters</p>
                    </div>

                    <div className="mt-6 space-y-4">
                      {[
                        "Lower per-farmer cost for pickup and mandi transfer.",
                        "Higher truck utilization across nearby villages.",
                        "Cleaner scheduling for buyers, transporters, and mandi operations.",
                      ].map((item) => (
                        <div key={item} className="rounded-2xl border border-white/8 bg-black/16 px-4 py-4 text-sm leading-7 text-white/72">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => setShowDetails((current) => !current)}
                      className="flex w-full items-center justify-between px-6 py-5 text-left"
                    >
                      <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[#dff8bc]">
                        Technical detail
                      </span>
                      <motion.div animate={{ rotate: showDetails ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="h-4 w-4 text-white/60" />
                      </motion.div>
                    </button>

                    {showDetails && (
                      <div className="border-t border-white/8 px-6 py-5 text-sm leading-7 text-white/62">
                        The routing model can be treated as a capacitated vehicle-routing problem with pickup clusters, time windows, load size, and mandi destination constraints. For the product experience, the key is surfacing one optimized route instead of forcing the user to coordinate separate trips manually.
                      </div>
                    )}
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
