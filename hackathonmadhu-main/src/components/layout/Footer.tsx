import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/lib/constants";
import { Github, Mail, MoveRight } from "lucide-react";

export function Footer() {
  return (
    <footer id="contact" className="py-14">
      <Container>
        <div className="landing-section-shell rounded-[1.9rem] px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-2xl">
              <a href="#" className="text-2xl font-black tracking-tight text-white">
                KISAN<span className="text-primary">-OS</span>
              </a>
              <p className="mt-4 text-base leading-8 text-white/68">
                Transparent trade, smarter logistics, and better price discovery for every farmer, buyer, mandi, and transport network.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#demo"
                  className="inline-flex items-center gap-2 rounded-full border border-[#d8f8b0]/22 bg-[#d8f8b0]/10 px-4 py-2 text-sm font-semibold text-[#dff8bc] transition-colors hover:text-white"
                >
                  Watch demo flow
                  <MoveRight className="h-4 w-4" />
                </a>
                <a
                  href="mailto:hello@kisan-os.in"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/76 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4" />
                  hello@kisan-os.in
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 lg:justify-end">
              <a href="#product" className="text-sm text-white/60 transition-colors hover:text-white">
                Product
              </a>
              <a href="#how-it-works" className="text-sm text-white/60 transition-colors hover:text-white">
                Workflow
              </a>
              <a href="#technology" className="text-sm text-white/60 transition-colors hover:text-white">
                Technology
              </a>
              <a href="#impact" className="text-sm text-white/60 transition-colors hover:text-white">
                Impact
              </a>
              <a
                href={siteConfig.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 transition-colors hover:text-white"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="relative z-10 mt-8 border-t border-white/8 pt-6 text-sm text-white/46">
            Built for farmers, buyers, and logistics teams across India.
          </div>
        </div>
      </Container>
    </footer>
  );
}
