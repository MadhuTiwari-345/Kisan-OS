"use client";

import { Globe, MoveRight, ShieldAlert, Truck, Users } from "lucide-react";

import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerContainer";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const problemCards = [
  {
    icon: ShieldAlert,
    stat: "20-40%",
    label: "Farmer value leakage",
    title: "Middlemen compress margins before farmers see the real price",
    description:
      "Without direct visibility into mandi pricing and buyer demand, too much of the final value disappears before the farmer makes a selling decision.",
  },
  {
    icon: Globe,
    stat: "90%",
    label: "Vernacular dependency",
    title: "Digital products still fail users who need language-first workflows",
    description:
      "Agri workflows often assume typed English forms. That creates immediate drop-off for the majority of rural users who need guided, spoken interaction.",
  },
  {
    icon: Truck,
    stat: "15-25%",
    label: "Logistics waste",
    title: "Fragmented transport turns every crop movement into avoidable cost",
    description:
      "Half-filled trucks, duplicated trips, and poor scheduling make even a correct selling decision less profitable by the time the crop reaches the mandi.",
  },
] as const;

export function ProblemSection() {
  return (
    <section id="product" className="relative py-24 md:py-28">
      <Container>
        <div className="landing-section-shell rounded-[1.9rem] px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
          <div className="relative z-10">
            <SectionHeading
              eyebrow="The Problem"
              title="Agriculture has information, but not a usable operating layer"
              subtitle="KISAN-OS addresses the gaps in trust, transparency, language access, and execution that keep the supply chain inefficient."
              align="left"
              className="mb-12"
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(160deg,rgba(6,20,17,0.9),rgba(10,31,24,0.72),rgba(65,71,15,0.58))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
                <div className="flex items-center gap-3 text-[#dff8bc]">
                  <Users className="h-5 w-5" />
                  <p className="text-xs font-bold uppercase tracking-[0.22em]">System pain map</p>
                </div>

                <div className="mt-8 space-y-5">
                  {[
                    "Farmer produces crop with limited price visibility",
                    "Buyer demand remains fragmented across local channels",
                    "Transport gets booked late and at inefficient cost",
                    "Decision quality drops because data stays disconnected",
                  ].map((item, index) => (
                    <div key={item} className="flex items-start gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[#d8f8b0]/20 bg-[#d8f8b0]/10 text-sm font-bold text-[#dff8bc]">
                        0{index + 1}
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-black/16 px-4 py-4 text-sm leading-7 text-white/72">
                        {item}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-[1.4rem] border border-[#cf40ff]/18 bg-[#cf40ff]/8 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">What this creates</p>
                  <p className="mt-3 text-lg leading-8 text-white/80">
                    A chain where price intelligence, logistics, and demand signals arrive too late to help the farmer.
                  </p>
                </div>
              </div>

              <StaggerContainer className="grid gap-5">
                {problemCards.map((card) => (
                  <StaggerItem key={card.title}>
                    <div className="group flex h-full flex-col rounded-[1.6rem] border border-white/8 bg-white/[0.035] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#d8f8b0]/20 hover:bg-white/[0.05]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d8f8b0]/12 text-[#dff8bc]">
                          <card.icon className="h-5 w-5" />
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-black text-white">{card.stat}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/46">{card.label}</p>
                        </div>
                      </div>

                      <h3 className="mt-6 max-w-2xl text-2xl font-semibold leading-tight text-white">{card.title}</h3>
                      <p className="mt-4 text-sm leading-7 text-white/64">{card.description}</p>

                      <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#dff8bc]">
                        <span>Why it matters</span>
                        <MoveRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
