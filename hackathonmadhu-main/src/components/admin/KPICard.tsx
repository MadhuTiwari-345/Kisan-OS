"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  className?: string;
}

export function KPICard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.05] hover:border-white/10",
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/[0.03] via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-[13px] font-medium tracking-wide text-white/40">
            {title}
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-white">
            {value}
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/10">
          <Icon className="h-5 w-5 text-purple-400" />
        </div>
      </div>

      {change && (
        <div className="relative mt-4 flex items-center gap-2 border-t border-white/[0.04] pt-4">
          <div
            className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold",
              changeType === "positive" && "bg-emerald-500/10 text-emerald-400",
              changeType === "negative" && "bg-red-500/10 text-red-400",
              changeType === "neutral" && "bg-white/5 text-white/40"
            )}
          >
            {changeType === "positive" && <TrendingUp className="h-3 w-3" />}
            {changeType === "negative" && <TrendingDown className="h-3 w-3" />}
            {change}
          </div>
          <span className="text-[11px] text-white/20">vs last week</span>
        </div>
      )}
    </div>
  );
}
