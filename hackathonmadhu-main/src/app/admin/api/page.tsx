"use client";

import { useAPIStore } from "@/stores/adminStore";
import { Activity, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function APIMonitoringPage() {
  const { services } = useAPIStore();

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {services.map((svc) => (
          <div
            key={svc.name}
            className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.05] hover:border-white/10"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[15px] font-bold tracking-tight text-white">{svc.name}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div
                    className={cn(
                      "h-2.5 w-2.5 rounded-full shadow-sm",
                      svc.status === "Active" && "bg-emerald-400",
                      svc.status === "Degraded" && "bg-amber-400",
                      svc.status === "Down" && "bg-red-400"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[12px] font-semibold",
                      svc.status === "Active" && "text-emerald-400",
                      svc.status === "Degraded" && "text-amber-400",
                      svc.status === "Down" && "text-red-400"
                    )}
                  >
                    {svc.status}
                  </span>
                </div>
              </div>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                svc.status === "Active" && "bg-emerald-500/10",
                svc.status === "Degraded" && "bg-amber-500/10",
                svc.status === "Down" && "bg-red-500/10"
              )}>
                <Activity
                  className={cn(
                    "h-5 w-5",
                    svc.status === "Active" && "text-emerald-400",
                    svc.status === "Degraded" && "text-amber-400",
                    svc.status === "Down" && "text-red-400"
                  )}
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.03] p-3.5 border border-white/[0.04]">
                <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider">
                  Latency
                </p>
                <p className={cn(
                  "mt-1.5 text-xl font-extrabold tracking-tight",
                  svc.latency < 200 ? "text-white" : svc.latency < 400 ? "text-amber-400" : "text-red-400"
                )}>
                  {svc.latency}ms
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3.5 border border-white/[0.04]">
                <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider">
                  Uptime
                </p>
                <p className={cn(
                  "mt-1.5 text-xl font-extrabold tracking-tight",
                  svc.uptime > 99 ? "text-white" : svc.uptime > 97 ? "text-amber-400" : "text-red-400"
                )}>
                  {svc.uptime}%
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-white/30">
              <Clock className="h-3 w-3" />
              Last sync:{" "}
              {new Date(svc.lastSync).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Error Logs */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden">
        <div className="border-b border-white/[0.06] px-6 py-5">
          <h3 className="text-[15px] font-bold tracking-tight text-white">Recent Error Logs</h3>
          <p className="mt-1 text-[12px] text-white/35">Last 7 days</p>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {services.flatMap((svc) =>
            svc.errors.map((err, i) => ({
              ...err,
              service: svc.name,
              key: `${svc.name}-${i}`,
            }))
          )
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((err) => (
              <div key={err.key} className="flex items-start gap-4 px-6 py-3.5 transition-colors hover:bg-white/[0.02]">
                <div className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                  err.code >= 500 ? "bg-red-500/10" : err.code >= 400 ? "bg-amber-500/10" : "bg-white/5"
                )}>
                  <AlertTriangle className={cn(
                    "h-4 w-4",
                    err.code >= 500 ? "text-red-400" : err.code >= 400 ? "text-amber-400" : "text-white/40"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-white">{err.service}</span>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      err.code >= 500 ? "bg-red-500/10 text-red-400" : err.code >= 400 ? "bg-amber-500/10 text-amber-400" : "bg-white/5 text-white/40"
                    )}>
                      {err.code}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-white/40 truncate">{err.message}</p>
                </div>
                <span className="shrink-0 text-[11px] text-white/20">
                  {new Date(err.timestamp).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Overall Health Bar */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm">
        <h3 className="text-[15px] font-bold tracking-tight text-white mb-5">
          30-Day Uptime Overview
        </h3>
        <div className="space-y-5">
          {services.map((svc) => (
            <div key={svc.name}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-white/60">{svc.name}</span>
                <span className="text-[12px] font-bold text-white/40">{svc.uptime}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-white/[0.06]">
                <div
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-700",
                    svc.uptime > 99 ? "bg-emerald-400" : svc.uptime > 97 ? "bg-amber-400" : "bg-red-400"
                  )}
                  style={{ width: `${svc.uptime}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
