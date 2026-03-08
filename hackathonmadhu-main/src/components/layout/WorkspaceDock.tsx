"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BrainCircuit,
  ChartColumnBig,
  LogOut,
  Map,
  ShoppingBag,
  Tractor,
  Truck,
  UserRound,
} from "lucide-react";

import { useAuthStore } from "@/stores/authStore";


const HIDDEN_PREFIXES = ["/admin"];
const HIDDEN_PATHS = new Set(["/", "/login", "/register"]);

const WORKSPACE_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: ChartColumnBig },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/market", label: "Market", icon: Map },
  { href: "/logistics", label: "Logistics", icon: Truck },
  { href: "/advisory", label: "Advisory", icon: BrainCircuit },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

export function WorkspaceDock() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  if (!pathname || HIDDEN_PATHS.has(pathname) || HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <div className="workspace-dock-wrapper pointer-events-none fixed inset-x-0 bottom-6 z-50 hidden justify-center px-4 lg:flex">
      <div className="workspace-dock pointer-events-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-[1.75rem] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="workspace-dock-brand flex h-11 w-11 items-center justify-center rounded-2xl">
            <Tractor className="h-5 w-5 text-[#062017]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#dff8bc]/76">KISAN-OS</p>
            <p className="text-sm font-semibold text-white">
              {user?.name || "Unified agri workflow"}
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          {WORKSPACE_LINKS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`workspace-dock-link flex items-center gap-2 rounded-2xl px-3 py-2 text-sm ${
                  isActive ? "workspace-dock-link-active" : ""
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/8 bg-black/16 px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/42">Status</p>
            <p className="text-sm font-semibold capitalize text-white">
              {isAuthenticated ? user?.role || "signed in" : "guest"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isAuthenticated) {
                logout();
              }
              router.push("/login");
            }}
            className="workspace-dock-logout inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white"
          >
            <LogOut className="h-4 w-4" />
            {isAuthenticated ? "Sign out" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
