"use client";

import { BarChart3, Mic, MoveRight, ShieldCheck, Truck } from "lucide-react";

import { FadeIn } from "@/components/animations/FadeIn";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const workflows = [
  {
    step: "01",
    icon: Mic,
    title: "Voice-first onboarding",
    subtitle: "Speech workflows in local languages",
    detail:
      "Farmers and buyers can register, search, and trigger tasks through guided language-first flows instead of form-heavy interfaces.",
  },
  {
    step: "02",
    icon: BarChart3,
    title: "Live market intelligence",
    subtitle: "Price comparison and AI-backed signals",
    detail:
      "Compare mandi prices, selling windows, and demand forecasts in one place so price decisions are based on live context.",
  },
  {
    step: "03",
    icon: Truck,
    title: "Coordinated transport",
    subtitle: "Pickup planning and shared routing",
    detail:
      "Move from crop discovery to transport confirmation without leaving the platform, while reducing delivery waste through milk-run logic.",
  },
] as const;

export function SolutionSection() {
  return (
    <section id="how-it-works" className="relative py-24 md:py-28">
      <Container>
        <div className="landing-section-shell rounded-[1.9rem] px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
          <div className="relative z-10">
            <SectionHeading
              eyebrow="How It Works"
              title="One continuous workflow from crop intent to market delivery"
              subtitle="The platform is structured like an operating system for the agri supply chain, not a set of disconnected screens."
              align="left"
              className="mb-12"
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,24,18,0.86),rgba(9,20,16,0.9))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
                <div className="grid gap-4">
                  {workflows.map((workflow, index) => (
                    <FadeIn key={workflow.title} delay={index * 0.08}>
                      <div className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#dff8bc]">{workflow.step}</span>
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#33ccb3] via-[#85b944] to-[#d8f8b0] text-[#062017] shadow-[0_14px_36px_rgba(51,204,179,0.18)]">
                            <workflow.icon className="h-5 w-5" />
                          </div>
                        </div>
                        <h3 className="mt-5 text-2xl font-semibold text-white">{workflow.title}</h3>
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-white/42">{workflow.subtitle}</p>
                        <p className="mt-4 text-sm leading-7 text-white/64">{workflow.detail}</p>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(160deg,rgba(7,25,20,0.92),rgba(50,65,16,0.52))] p-6">
                  <div className="flex items-center gap-3 text-[#dff8bc]">
                    <ShieldCheck className="h-5 w-5" />
                    <p className="text-xs font-bold uppercase tracking-[0.22em]">Workflow outcomes</p>
                  </div>

                  <div className="mt-6 space-y-4">
                    {[
                      "Farmers get a clear path from discovery to sale.",
                      "Buyers see listings, prices, and transport coordination in one surface.",
                      "Admins monitor market activity, route performance, and platform health from one control layer.",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/16 px-4 py-4">
                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#dff8bc]" />
                        <p className="text-sm leading-7 text-white/72">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#dff8bc]">Operating principle</p>
                  <p className="mt-4 text-2xl font-semibold leading-tight text-white">
                    Every screen should help the user make the next real-world supply-chain decision.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#dff8bc]">
                    <span>Designing for decisions</span>
                    <MoveRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
