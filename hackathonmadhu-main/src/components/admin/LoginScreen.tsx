"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Eye, EyeOff, Sprout, ArrowRight, AlertCircle } from "lucide-react";

export function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate network delay for feel
    await new Promise((r) => setTimeout(r, 600));

    const ok = await login(id, password);
    if (!ok) {
      setError("Invalid credentials. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="login-bg login-grid fixed inset-0 z-[100] flex items-center justify-center">
      {/* Floating orbs for depth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute -bottom-48 -right-48 h-[500px] w-[500px] rounded-full bg-pink-500/5 blur-3xl" />
        <div className="absolute top-1/4 right-1/4 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md px-6 animate-fade-up">
        {/* Logo + branding */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-lg shadow-purple-900/30">
            <Sprout className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            KISAN<span className="text-purple-400">-OS</span>
          </h1>
          <p className="mt-2 text-sm text-purple-200/60">
            Agricultural Intelligence Platform
          </p>
        </div>

        {/* Login card */}
        <div className="glass-dark rounded-2xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">
              Sign in to Admin
            </h2>
            <p className="mt-1 text-sm text-white/40">
              Enter your credentials to access the dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ID field */}
            <div>
              <label
                htmlFor="login-id"
                className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50"
              >
                Phone or Email
              </label>
              <input
                id="login-id"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Enter phone or admin email"
                autoComplete="username"
                autoFocus
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 transition-all focus:border-purple-500/50 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="login-password"
                className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder:text-white/20 transition-all focus:border-purple-500/50 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !id || !password}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/25 transition-all hover:from-purple-500 hover:to-fuchsia-400 hover:shadow-purple-900/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-white/20">
          KISAN-OS Admin Panel &middot; Secured Access
        </p>
        <p className="mt-2 text-center text-xs text-white/25">
          Admin credentials: `admin@kisan-os.in` / `admin123`
        </p>
      </div>
    </div>
  );
}
