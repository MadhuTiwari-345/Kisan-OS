"use client";

import { MapPin, TrendingUp, Truck } from "lucide-react";

import { CountUp } from "@/components/animations/CountUp";
import { FadeIn } from "@/components/animations/FadeIn";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerContainer";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const metrics = [
  {
    icon: TrendingUp,
    value: 30,
    prefix: "+",
    suffix: "%",
    label: "Higher farmer income potential",
    description: "Better price discovery and direct access can improve final realization per harvest cycle.",
  },
  {
    icon: Truck,
    value: 40,
    prefix: "",
    suffix: "%",
    label: "Lower logistics cost",
    description: "Shared routing and consolidated pickups reduce avoidable transport overhead.",
  },
  {
    icon: MapPin,
    value: 50,
    prefix: "",
    suffix: "km",
    label: "Expanded market reach",
    description: "Coordinated discovery and delivery help farmers sell beyond the nearest mandi radius.",
  },
] as const;

export function ImpactSection() {
  return (
    <section id="impact" className="relative py-24 md:py-28">
      <Container>
        <div className="landing-section-shell rounded-[1.9rem] px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
          <div className="relative z-10">
            <SectionHeading
              eyebrow="Impact"
              title="Designed to improve both margins and execution quality"
              subtitle="The point is not just better visuals. The point is better outcomes across pricing, transport, and market access."
              align="left"
              className="mb-12"
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <FadeIn>
                <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(160deg,rgba(7,25,20,0.92),rgba(56,72,18,0.52))] p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#dff8bc]">Impact lens</p>
                  <h3 className="mt-5 text-3xl font-semibold leading-tight text-white">
                    Better information only matters when it changes what happens in the field.
                  </h3>
                  <div className="mt-6 space-y-4">
                    {[
                      "Higher price confidence before selling.",
                      "Fewer duplicated trips before delivery.",
                      "Broader reach into buyers and mandis that were previously out of scope.",
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/8 bg-black/16 px-4 py-4 text-sm leading-7 text-white/72">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>

              <StaggerContainer className="grid gap-5 md:grid-cols-3">
                {metrics.map((metric) => (
                  <StaggerItem key={metric.label}>
                    <FadeIn>
                      <div className="flex h-full flex-col rounded-[1.55rem] border border-white/8 bg-white/[0.035] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#d8f8b0]/20">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#33ccb3] via-[#85b944] to-[#d8f8b0] text-[#062017] shadow-[0_14px_36px_rgba(51,204,179,0.18)]">
                          <metric.icon className="h-6 w-6" />
                        </div>
                        <div className="mt-8 text-6xl font-black gradient-text md:text-7xl">
                          <CountUp to={metric.value} duration={1.5} prefix={metric.prefix} suffix={metric.suffix} />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold text-white">{metric.label}</h3>
                        <p className="mt-3 text-sm leading-7 text-white/62">{metric.description}</p>
                      </div>
                    </FadeIn>
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
