"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "active" | "inactive" | "pending" | "completed" | "assigned" | "yes" | "no";

const variants: Record<BadgeVariant, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  inactive: "bg-white/5 text-white/40 border-white/10",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  assigned: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  yes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  no: "bg-white/5 text-white/40 border-white/10",
};

const dots: Record<BadgeVariant, string> = {
  active: "bg-emerald-400",
  inactive: "bg-white/30",
  pending: "bg-amber-400",
  completed: "bg-blue-400",
  assigned: "bg-purple-400",
  yes: "bg-emerald-400",
  no: "bg-white/30",
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize",
        variants[variant],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[variant])} />
      {children}
    </span>
  );
}
