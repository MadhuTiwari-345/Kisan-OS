import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { SolutionSection } from "@/components/sections/SolutionSection";
import { MilkRunSection } from "@/components/sections/MilkRunSection";
import { DemoSection } from "@/components/sections/DemoSection";
import { ImpactSection } from "@/components/sections/ImpactSection";
import { TechStackSection } from "@/components/sections/TechStackSection";
import { LandingBackground } from "@/components/layout/LandingBackground";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-slate-950">
      <LandingBackground />
      <div className="noise-overlay" />
      <div className="relative z-10">
        <Navbar />
        <main>
          <HeroSection />
          <div className="section-divider" />
          <ProblemSection />
          <div className="section-divider" />
          <SolutionSection />
          <div className="section-divider" />
          <MilkRunSection />
          <div className="section-divider" />
          <DemoSection />
          <div className="section-divider" />
          <ImpactSection />
          <div className="section-divider" />
          <TechStackSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}
