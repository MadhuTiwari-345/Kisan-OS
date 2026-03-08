"use client";

import { BarChart3, BrainCircuit, Languages, ShieldCheck, Store, WifiOff } from "lucide-react";

import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerContainer";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const techStack = [
  {
    icon: Languages,
    name: "Voice and language layer",
    description: "Multilingual capture, prompts, and guided workflows for farmer-first usability.",
  },
  {
    icon: BarChart3,
    name: "Market price engine",
    description: "Live mandi comparisons, crop signals, and recommendation logic.",
  },
  {
    icon: Store,
    name: "Marketplace workflow",
    description: "Listings, buyer discovery, order flow, and transaction states in one interface.",
  },
  {
    icon: BrainCircuit,
    name: "AI decision support",
    description: "Forecasting, route optimization, and role-specific operational guidance.",
  },
  {
    icon: WifiOff,
    name: "Offline resilience",
    description: "Graceful fallback patterns for weaker connectivity in field conditions.",
  },
  {
    icon: ShieldCheck,
    name: "Role-based access",
    description: "Secure auth and workspace routing across farmer, buyer, admin, and logistics users.",
  },
] as const;

export function TechStackSection() {
  return (
    <section id="technology" className="relative py-24 md:py-28">
      <Container>
        <div className="landing-section-shell rounded-[1.9rem] px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
          <div className="relative z-10">
            <SectionHeading
              eyebrow="Technology"
              title="Built for a working agri platform, not just a presentation dashboard"
              subtitle="The stack is organized around the actual tasks users need to complete: discover prices, sell produce, coordinate transport, and monitor operations."
              align="left"
              className="mb-12"
            />

            <StaggerContainer className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {techStack.map((tech) => (
                <StaggerItem key={tech.name}>
                  <div className="flex h-full flex-col rounded-[1.5rem] border border-white/8 bg-white/[0.035] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#d8f8b0]/20">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#33ccb3] via-[#85b944] to-[#d8f8b0] text-[#062017] shadow-[0_14px_36px_rgba(51,204,179,0.18)]">
                        <tech.icon className="h-5 w-5" />
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-white">{tech.name}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/62">{tech.description}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </Container>
    </section>
  );
}
