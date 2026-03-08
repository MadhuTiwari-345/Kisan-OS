"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  House,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sprout,
  Store,
  Truck,
  User2,
} from "lucide-react";

import { LandingBackground } from "@/components/layout/LandingBackground";
import { Container } from "@/components/ui/Container";
import { FARMER_LANGUAGES } from "@/lib/languages";
import { useAuthStore } from "@/stores/authStore";

interface AuthCardProps {
  mode: "login" | "register";
}

const ROLE_OPTIONS = [
  { value: "farmer", label: "Farmer", icon: Sprout, description: "List crops, track prices, and manage farm operations." },
  { value: "buyer", label: "Buyer", icon: Store, description: "Source produce, compare pricing, and manage procurement." },
  { value: "logistics", label: "Logistics", icon: Truck, description: "Coordinate pickups, routes, and delivery execution." },
] as const;

const registerPoints = [
  "Role-aware onboarding for farmers, buyers, and transport teams.",
  "Structured signup with profile, location, language, and access details.",
  "Direct route into the app after registration instead of a dead-end page.",
] as const;

const loginPoints = [
  "Continue directly to your saved workflow after authentication.",
  "Use mobile or email login with a cleaner, more product-like screen.",
  "Admin demo account remains available for fast evaluation.",
] as const;

function resolveRoute(role?: string) {
  if (role === "admin") return "/admin";
  if (role === "buyer") return "/marketplace";
  if (role === "logistics") return "/logistics";
  return "/dashboard";
}

export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const { login, register, isLoading, error, clearError } = useAuthStore();

  const isRegister = mode === "register";
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("hi-IN");
  const [location, setLocation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState<"farmer" | "buyer" | "logistics">("farmer");
  const [formError, setFormError] = useState("");

  const activeRole = useMemo(
    () => ROLE_OPTIONS.find((item) => item.value === role) || ROLE_OPTIONS[0],
    [role]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    setFormError("");

    if (isRegister) {
      if (name.trim().length < 2) {
        setFormError("Enter your full name.");
        return;
      }
      if (!/^\d{10}$/.test(phone)) {
        setFormError("Enter a valid 10-digit mobile number.");
        return;
      }
      if (password.length < 6) {
        setFormError("Password must be at least 6 characters.");
        return;
      }
      if (role === "buyer" && companyName.trim().length < 2) {
        setFormError("Enter your company or organization name.");
        return;
      }

      const ok = await register({
        phone,
        name: name.trim(),
        password,
        email: email || undefined,
        language,
        role,
        location: location || undefined,
        company_name: role === "buyer" ? companyName || undefined : undefined,
      });

      if (ok) router.push(resolveRoute(role));
      return;
    }

    if (!identifier.trim()) {
      setFormError("Enter your phone number or email.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    const ok = await login(identifier.trim(), password);
    if (ok) {
      const state = useAuthStore.getState();
      router.push(resolveRoute(state.user?.role));
    }
  }

  const sidePoints = isRegister ? registerPoints : loginPoints;

  return (
    <div className="relative min-h-screen overflow-hidden py-24 lg:py-12">
      <LandingBackground />
      <div className="noise-overlay" />

      <Container className="relative z-10 max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/84 transition-colors hover:bg-white/8 hover:text-white"
          >
            <House className="h-4 w-4" />
            Back to home
          </Link>

          <div className="rounded-full border border-[#d8f8b0]/20 bg-[#d8f8b0]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#dff8bc]">
            {isRegister ? "Sign up" : "Login"}
          </div>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(280px,0.86fr)_minmax(0,1.14fr)] xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
          <div className="rounded-[2rem] border border-white/10 bg-[rgba(5,17,15,0.82)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8 md:p-10 lg:sticky lg:top-28">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d8f8b0]/25 bg-[#d8f8b0]/10">
              <span className="text-xl font-black text-[#dff8bc]">K</span>
            </div>

            <p className="mt-6 inline-flex rounded-full border border-[#d8f8b0]/20 bg-[#d8f8b0]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#dff8bc]">
              {isRegister ? "Create your account" : "Secure access"}
            </p>

            <h1 className="mt-5 max-w-[8ch] text-[clamp(2.9rem,5vw,4.8rem)] font-black leading-[0.92] tracking-tight text-white">
              {isRegister ? "Create a balanced onboarding flow" : "Login that feels like the product"}
            </h1>

            <p className="mt-5 max-w-md text-base leading-8 text-white/66">
              {isRegister
                ? "The signup screen is split cleanly into product context and form flow, so the page reads like a real platform instead of stacked widgets."
                : "The login screen matches the landing experience and keeps the account flow readable across desktop, tablet, and mobile widths."}
            </p>

            <div className="mt-8 space-y-3">
              {sidePoints.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#dff8bc]" />
                  <p className="text-sm leading-7 text-white/66">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <Sprout className="h-5 w-5 text-[#dff8bc]" />
                <p className="mt-4 text-xs uppercase tracking-[0.16em] text-white/44">Farmer</p>
                <p className="mt-2 text-sm leading-6 text-white/70">List produce and understand prices without a confusing UI.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <Store className="h-5 w-5 text-[#dff8bc]" />
                <p className="mt-4 text-xs uppercase tracking-[0.16em] text-white/44">Buyer</p>
                <p className="mt-2 text-sm leading-6 text-white/70">Access procurement and marketplace actions through a clean entry page.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <ShieldCheck className="h-5 w-5 text-[#dff8bc]" />
                <p className="mt-4 text-xs uppercase tracking-[0.16em] text-white/44">Trusted</p>
                <p className="mt-2 text-sm leading-6 text-white/70">Role-aware auth, clear states, and quick navigation into the app.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[rgba(5,17,15,0.88)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8 md:p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">
                {isRegister ? "Onboarding details" : "Account access"}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                {isRegister ? "Create your KISAN-OS account" : "Continue to your workspace"}
              </h2>
              <p className="mt-3 text-base leading-7 text-white/62">
                {isRegister
                  ? "Signup now includes role selection, supporting details, and a more complete layout that looks like a real website flow."
                  : "Use your registered phone or email to continue. Admin demo credentials are shown below."}
              </p>
            </div>

            {isRegister && (
              <div className="mt-8">
                <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                  Select role
                </label>
                <div className="grid gap-3 md:grid-cols-3">
                  {ROLE_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRole(item.value)}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        role === item.value
                          ? "border-[#d8f8b0]/30 bg-[#d8f8b0]/10 shadow-[0_18px_36px_rgba(201,240,163,0.08)]"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <item.icon className={`h-5 w-5 ${role === item.value ? "text-[#dff8bc]" : "text-white/58"}`} />
                      <p className="mt-3 text-base font-semibold text-white">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-white/56">{item.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {isRegister && (
                <div className="grid gap-5 xl:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/48">Full name</label>
                    <div className="relative">
                      <User2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                      <input value={name} onChange={(event) => setName(event.target.value)} className="app-input app-input-with-icon" placeholder="Enter your full name" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/48">Mobile number</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                      <input
                        value={phone}
                        onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="app-input app-input-with-icon"
                        placeholder="10-digit mobile number"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isRegister && (
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/48">Phone or email</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="app-input app-input-with-icon" placeholder="Phone number or email" />
                  </div>
                </div>
              )}

              {isRegister && (
                <div className="grid gap-5 xl:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/48">Email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                      <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="app-input app-input-with-icon" placeholder="you@example.com" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/48">Location</label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                      <input value={location} onChange={(event) => setLocation(event.target.value)} className="app-input app-input-with-icon" placeholder="Village, city, mandi region" />
                    </div>
                  </div>
                </div>
              )}

              {isRegister && role === "buyer" && (
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/48">Company</label>
                  <div className="relative">
                    <BriefcaseBusiness className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} className="app-input app-input-with-icon" placeholder="Buyer company name" />
                  </div>
                </div>
              )}

              <div className={isRegister ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_220px]" : "grid gap-5"}>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/48">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="app-input app-input-with-icon app-input-with-trailing-icon"
                      placeholder="Minimum 6 characters"
                    />
                    <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isRegister && (
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/48">
                      <Globe className="h-3.5 w-3.5" />
                      Language
                    </label>
                    <select value={language} onChange={(event) => setLanguage(event.target.value)} className="app-select">
                      {FARMER_LANGUAGES.map((item) => (
                        <option key={item.code} value={item.code} className="bg-[#0d1713]">
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {(formError || error) && (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {formError || error}
                </div>
              )}

              <button type="submit" disabled={isLoading} className="app-button-primary flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold disabled:opacity-65">
                {isRegister ? "Create account" : "Login"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-white/58">
                Current role preview: <span className="font-semibold text-white">{activeRole.label}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-white/58">
                Demo admin login: <span className="font-semibold text-white">admin@kisan-os.in / admin123</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <Link href={isRegister ? "/login" : "/register"} className="text-[#dff8bc] transition-colors hover:text-white">
                {isRegister ? "Already have an account? Login" : "Need an account? Register"}
              </Link>
              <Link href="/" className="text-white/58 transition-colors hover:text-white">
                Back to landing page
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
