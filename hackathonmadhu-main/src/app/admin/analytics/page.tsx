"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";

import { ChartWrapper } from "@/components/admin/Charts";
import { analyticsApi } from "@/lib/api";

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof analyticsApi.dashboard>> | null>(null);
  const [revenue, setRevenue] = useState<Awaited<ReturnType<typeof analyticsApi.revenue>> | null>(null);
  const [cropTrends, setCropTrends] = useState<Awaited<ReturnType<typeof analyticsApi.cropTrends>>["items"]>([]);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      try {
        const [dashboardResult, revenueResult, trendResult] = await Promise.all([
          analyticsApi.dashboard(),
          analyticsApi.revenue(),
          analyticsApi.cropTrends(),
        ]);
        if (!cancelled) {
          setDashboard(dashboardResult);
          setRevenue(revenueResult);
          setCropTrends(trendResult.items);
        }
      } catch {
        // Keep empty state.
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const revenueSeries = useMemo(() => {
    if (!revenue) return [];
    const paid = revenue.paid_revenue;
    const pending = revenue.pending_revenue;
    return [
      { label: "Paid", value: paid },
      { label: "Pending", value: pending },
      { label: "Gross", value: revenue.total_revenue },
    ];
  }, [revenue]);

  const demandSeries = useMemo(() => {
    return (dashboard?.market_intelligence.demand_forecast || []).map((item) => ({
      crop: item.crop,
      projected: item.projected_demand_kg,
      supply: item.active_supply_kg,
    }));
  }, [dashboard]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Analytics Overview</h2>
        <p className="mt-1 text-sm text-white/35">
          Real marketplace revenue, demand projections, crop trends, and logistics performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-xs text-white/35">Gross Merchandise Value</p>
          <p className="mt-2 text-2xl font-bold text-white">
            Rs {dashboard?.marketplace.gross_merchandise_value.toLocaleString("en-IN") || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-xs text-white/35">Open Bids</p>
          <p className="mt-2 text-2xl font-bold text-white">{dashboard?.marketplace.open_bids || 0}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-xs text-white/35">Transport Requests</p>
          <p className="mt-2 text-2xl font-bold text-white">{dashboard?.logistics.transport_requests || 0}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-xs text-white/35">Successful Transactions</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {dashboard?.transactions.successful_transactions || 0}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartWrapper title="Revenue Split" subtitle="Paid, pending, and total platform revenue">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  background: "rgba(15, 18, 20, 0.95)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                }}
              />
              <Bar dataKey="value" fill="#9ecb5a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper title="Demand vs Supply" subtitle="AI demand forecast against current active supply">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={demandSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="crop" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  background: "rgba(15, 18, 20, 0.95)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                }}
              />
              <Area type="monotone" dataKey="projected" stackId="1" stroke="#33ccb3" fill="rgba(51,204,179,0.35)" />
              <Area type="monotone" dataKey="supply" stackId="2" stroke="#c9f0a3" fill="rgba(201,240,163,0.35)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
        <h3 className="text-[15px] font-bold tracking-tight text-white">Crop Trend Snapshot</h3>
        <p className="mt-1 text-[12px] text-white/35">Active listings, quantity, and average sell prices.</p>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cropTrends.map((item) => (
            <div key={item.crop} className="rounded-xl border border-white/[0.05] bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold capitalize text-white">{item.crop}</p>
                <span className="text-xs text-[#d6f6ab]">{item.active_listings} active</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-white/35">Quantity</p>
                  <p className="font-semibold text-white">{Math.round(item.quantity_kg)} kg</p>
                </div>
                <div>
                  <p className="text-xs text-white/35">Avg price</p>
                  <p className="font-semibold text-white">Rs {item.avg_price_per_kg.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
          {cropTrends.length === 0 && <p className="text-sm text-white/40">No crop trend records available yet.</p>}
        </div>
      </div>
    </div>
  );
}
