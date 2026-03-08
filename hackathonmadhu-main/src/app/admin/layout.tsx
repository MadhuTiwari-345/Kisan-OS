"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { LoginScreen } from "@/components/admin/LoginScreen";
import {
  LayoutDashboard,
  Store,
  Users,
  Truck,
  BarChart3,
  Activity,
  Settings,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  Sprout,
  Bell,
} from "lucide-react";

const sidebarItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Mandi Data", href: "/admin/mandi", icon: Store },
  { label: "Farmers", href: "/admin/farmers", icon: Users },
  { label: "Logistics", href: "/admin/logistics", icon: Truck },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "API Health", href: "/admin/api", icon: Activity },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { hasHydrated, isAuthenticated, user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  // ── Auth gate ──────────────────────────────────
  if (!hasHydrated) {
    return (
      <div className="admin-bg admin-grid-bg flex min-h-screen items-center justify-center px-6 text-white">
        <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[rgba(8,18,14,0.72)] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <p className="app-kicker">Preparing admin</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white">Loading secure admin workspace</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") return <LoginScreen />;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-[#0a0a14] transition-all duration-300 lg:static",
          collapsed ? "w-[72px]" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5">
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-lg shadow-purple-900/40">
                <Sprout className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                KISAN<span className="text-purple-400">-OS</span>
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/admin" className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-lg shadow-purple-900/40">
              <Sprout className="h-4.5 w-4.5 text-white" />
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/5 hover:text-white/70 lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 pt-4" role="navigation" aria-label="Admin navigation">
          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/25">
              Navigation
            </p>
          )}
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                isActive(item.href)
                  ? "sidebar-active bg-purple-500/10 text-purple-400"
                  : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  isActive(item.href) ? "text-purple-400" : "text-white/35 group-hover:text-white/60",
                  collapsed && "mx-auto"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
              {isActive(item.href) && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-purple-400 glow-dot" />
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="space-y-1 border-t border-white/[0.06] px-3 py-3">
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden w-full items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/50 lg:flex cursor-pointer"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
            {!collapsed && <span>Collapse</span>}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
          >
            <LogOut className={cn("h-[18px] w-[18px] shrink-0", collapsed && "mx-auto")} />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content area ────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden admin-bg admin-grid-bg">
        {/* Top navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-5 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 transition-colors hover:bg-white/5 lg:hidden cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                {sidebarItems.find((i) => isActive(i.href))?.label || "Dashboard"}
              </h1>
              <p className="text-xs text-white/30">KISAN-OS control layer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white/30 transition-colors hover:bg-white/5 hover:text-white/60 cursor-pointer">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-purple-500 ring-2 ring-[#0c0c14]" />
            </button>

            {/* Divider */}
            <div className="hidden h-8 w-px bg-white/[0.06] sm:block" />

            {/* User */}
            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className="text-[13px] font-semibold text-white/80">{user?.name || "Admin"}</p>
                <p className="text-[11px] text-white/30">Super Admin</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-xs font-bold text-white shadow-sm">
                {(user?.name || "A")[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
