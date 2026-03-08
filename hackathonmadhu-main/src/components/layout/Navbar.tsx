"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Menu, Sparkles, X } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { navLinks } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

export function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { hasHydrated, isAuthenticated, user, checkAuth } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    checkAuth();
  }, [checkAuth, hasHydrated]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const getAppUrl = () => {
    if (!hasHydrated) return "/login";

    if (isAuthenticated && user) {
      if (user.role === "admin") return "/admin";
      if (user.role === "buyer") return "/marketplace";
      if (user.role === "logistics") return "/logistics";
      return "/dashboard";
    }

    return "/login";
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-200",
        scrolled ? "border-b border-white/10 bg-[#091713]/88 backdrop-blur-xl" : "bg-transparent"
      )}
    >
      <Container className="max-w-6xl">
        <nav className="flex h-[76px] items-center justify-between gap-6" aria-label="Main navigation">
          <button type="button" onClick={() => router.push("/")} className="text-left text-xl font-black tracking-tight text-white">
            KISAN<span className="text-primary">-OS</span>
          </button>

          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-semibold text-white/72 transition-colors hover:text-white">
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm font-semibold text-white/72 transition-colors hover:text-white"
            >
              Login
            </button>
            <a
              href="#demo"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#cf40ff] via-[#ba35ff] to-[#982fff] px-6 py-3 text-sm font-bold text-white shadow-[0_16px_40px_rgba(186,53,255,0.32)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              Try Demo
            </a>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-white lg:hidden"
            onClick={() => setIsOpen((current) => !current)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </Container>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[#07110d]/78 backdrop-blur-md lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="absolute inset-x-0 top-full z-50 border-t border-white/10 bg-[linear-gradient(180deg,rgba(9,23,19,0.98),rgba(16,29,18,0.98))] px-4 py-5 shadow-[0_30px_90px_rgba(0,0,0,0.34)] lg:hidden"
            >
              <Container className="max-w-6xl px-0">
                <div className="max-h-[calc(100vh-5.5rem)] space-y-4 overflow-y-auto">
                  <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-5">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#dff8bc]">
                      <Sparkles className="h-3.5 w-3.5" />
                      Smart agri workflow
                    </div>
                    <p className="mt-3 text-2xl font-black tracking-tight text-white">
                      Product navigation, signup, and demo access in one clean menu.
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/62">
                      This menu now works like a proper mobile website overlay instead of leaving the page looking empty.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {navLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-white/82 transition-colors hover:border-[#d8f8b0]/25 hover:bg-white/[0.05]"
                      >
                        <span className="text-base font-semibold">{link.label}</span>
                        <ChevronRight className="h-4 w-4 text-white/42" />
                      </a>
                    ))}
                  </div>

                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/login");
                      }}
                      className="rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-4 text-sm font-semibold text-white transition-colors hover:bg-white/[0.06]"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/register");
                      }}
                      className="rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-4 text-sm font-semibold text-white transition-colors hover:bg-white/[0.06]"
                    >
                      Sign Up
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        router.push(getAppUrl());
                      }}
                      className="rounded-2xl bg-gradient-to-r from-[#cf40ff] via-[#ba35ff] to-[#982fff] px-5 py-4 text-sm font-bold text-white shadow-[0_16px_40px_rgba(186,53,255,0.32)]"
                    >
                      {hasHydrated && isAuthenticated ? "Open App" : "Open Login"}
                    </button>
                  </div>
                </div>
              </Container>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
