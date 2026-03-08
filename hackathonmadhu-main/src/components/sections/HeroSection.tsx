"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Mic, Shield, Sparkles, TrendingUp, Truck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const metrics = [
  { value: "150M+", label: "Farmers targeted" },
  { value: "22", label: "Languages" },
  { value: "100%", label: "Open source" },
] as const;

const featureTiles = [
  {
    icon: Sparkles,
    title: "AI market guidance",
    description: "Forecast-driven selling signals for farmers and buyers.",
  },
  {
    icon: TrendingUp,
    title: "Live mandi prices",
    description: "Transparent crop pricing across connected markets.",
  },
  {
    icon: Truck,
    title: "Milk-run logistics",
    description: "Pickup planning and shared transport optimization.",
  },
] as const;

function PhonePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[410px]">
      <div className="absolute -left-12 top-18 h-36 w-36 rounded-full bg-[#33ccb3]/22 blur-3xl" />
      <div className="absolute -right-10 bottom-10 h-40 w-40 rounded-full bg-[#cf40ff]/16 blur-3xl" />

      <div className="relative rounded-[2.75rem] border border-white/12 bg-[linear-gradient(180deg,rgba(107,117,28,0.68),rgba(70,76,18,0.74))] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.36)]">
        <div className="mx-auto mb-3 h-4 w-28 rounded-full bg-white/10" />

        <div className="rounded-[2.15rem] border border-black/30 bg-[linear-gradient(180deg,rgba(21,25,16,0.94),rgba(10,14,10,0.96))] p-4">
          <div className="flex items-center justify-between text-[11px] text-white/60">
            <span className="font-semibold text-[#dff8bc]">KISAN-OS</span>
            <span>Hindi</span>
          </div>

          <div className="mt-4 rounded-2xl border border-[#cf40ff]/30 bg-[linear-gradient(135deg,rgba(207,64,255,0.16),rgba(255,255,255,0.06))] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#cf40ff] text-white shadow-[0_12px_24px_rgba(207,64,255,0.35)]">
                <Mic className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">&quot;Mujhe gehu ka daam batao&quot;</p>
                <p className="text-xs text-white/72">Listening...</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/42">Market prices</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.05] p-3">
                <p className="text-[11px] text-white/50">Khanna</p>
                <p className="mt-1 text-xl font-black text-white">Rs 2,280</p>
              </div>
              <div className="rounded-2xl border border-[#33ccb3]/25 bg-[#33ccb3]/12 p-3">
                <p className="text-[11px] font-semibold text-[#dff8bc]">Azadpur best</p>
                <p className="mt-1 text-xl font-black text-[#dff8bc]">Rs 2,410</p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-gradient-to-r from-[#cf40ff] via-[#ba35ff] to-[#982fff] p-4 text-center text-white shadow-[0_18px_40px_rgba(186,53,255,0.34)]">
            <p className="text-sm font-bold">Request Pickup</p>
            <p className="mt-1 text-xs text-white/80">Truck available tomorrow morning</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-24">
      <Container className="max-w-6xl">
        <div className="landing-section-shell rounded-[2rem] px-6 py-8 sm:px-8 md:py-10 lg:px-10 lg:py-12">
          <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(330px,420px)] xl:gap-18">
            <div className="max-w-[44rem]">
              <div className="inline-flex items-center rounded-full border border-[#d8f8b0]/25 bg-[#d8f8b0]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#dff8bc]">
                Open-source agri-tech platform
              </div>

              <h1 className="mt-8 max-w-[10ch] text-[clamp(4rem,8vw,6.8rem)] font-black leading-[0.9] tracking-tight text-white">
                Voice-Powered
                <span className="block">Intelligence for</span>
                <span className="gradient-text block">Every Farmer</span>
              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-white/72 sm:text-[1.34rem] sm:leading-10">
                KISAN-OS connects farmers to market prices, logistics, and real-time advisory in their own language. No apps to learn. Just speak.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={() => router.push("/login")} className="justify-center sm:min-w-[220px]">
                  Open Farmer App
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => router.push("/admin")} className="justify-center sm:min-w-[270px]">
                  Admin Command Center
                  <Shield className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {metrics.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                    <p className="text-3xl font-black text-white">{item.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/46">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-3">
                {featureTiles.map((tile) => (
                  <div key={tile.title} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="flex items-center gap-2 text-[#dff8bc]">
                      <tile.icon className="h-4 w-4" />
                      <p className="text-sm font-semibold">{tile.title}</p>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-white/62">{tile.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <PhonePreview />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
