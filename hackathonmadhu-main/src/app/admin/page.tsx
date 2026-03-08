"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChartComponent,
  ChartWrapper,
  LineChartComponent,
  PieChartComponent,
} from "@/components/admin/Charts";
import { KPICard } from "@/components/admin/KPICard";
import {
  cropDistributionData,
  logisticsRegionData,
  priceTrendData,
  useAPIStore,
  useFarmerStore,
  useLogisticsStore,
  useMandiStore,
} from "@/stores/adminStore";
import { marketApi, type MarketPriceResponse } from "@/lib/api";
import { Activity, Store, Truck, Users, Wallet } from "lucide-react";

export default function AdminDashboard() {
  const { entries, setEntries } = useMandiStore();
  const { farmers } = useFarmerStore();
  const { requests } = useLogisticsStore();
  const { services, setServices } = useAPIStore();
  const [loadingLiveData, setLoadingLiveData] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const [wheat, onion, tomato] = await Promise.allSettled([
          marketApi.getPrices("wheat"),
          marketApi.getPrices("onion"),
          marketApi.getPrices("tomato"),
        ]);

        const pricePayload = [wheat, onion, tomato]
          .filter((result): result is PromiseFulfilledResult<MarketPriceResponse> => {
            return result.status === "fulfilled";
          })
          .flatMap((result, groupIndex) =>
            (result.value.prices || []).map((item, index) => ({
              id: `LIVE-${groupIndex}-${index}`,
              mandiName: item.mandi || "Unknown Mandi",
              state: item.state || "Unknown",
              crop: item.crop_name || "Crop",
              price: Number(item.price || item.price_per_kg * 100 || 0),
              lastUpdated: new Date().toISOString().slice(0, 10),
              status: "Active" as const,
            }))
          );

        if (!cancelled && pricePayload.length > 0) {
          setEntries(pricePayload);
        }

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/health`
          );
          const health = await response.json();
          const liveServices = Object.entries(health.services || {}).map(([name, status], index) => ({
            name: `${String(name).toUpperCase()} API`,
            status:
              status === "operational"
                ? ("Active" as const)
                : ("Degraded" as const),
            latency: 110 + index * 70,
            uptime: 99 - index * 0.7,
            lastSync: new Date().toISOString(),
            errors: [],
          }));

          if (!cancelled && liveServices.length > 0) {
            setServices(liveServices);
          }
        } catch {
          // Keep seed API health data.
        }
      } finally {
        if (!cancelled) {
          setLoadingLiveData(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [setEntries, setServices]);

  const activeMandis = entries.filter((entry) => entry.status === "Active").length;
  const activeRequests = requests.filter((request) => request.status !== "Completed").length;
  const averagePrice =
    entries.length > 0
      ? Math.round(entries.reduce((sum, entry) => sum + entry.price, 0) / entries.length)
      : 0;
  const serviceHealth =
    services.length > 0
      ? Math.round(
          services.reduce((sum, item) => sum + item.uptime, 0) / services.length
        )
      : 0;

  const recentActivity = useMemo(() => {
    return [
      entries[0]
        ? `Fresh mandi feed: ${entries[0].mandiName} ${entries[0].crop} Rs ${entries[0].price}`
        : "Waiting for mandi sync",
      requests[0]
        ? `Latest logistics pool: ${requests[0].pickupVillage} to ${requests[0].destinationMandi}`
        : "No logistics requests yet",
      services[0]
        ? `${services[0].name} status ${services[0].status.toLowerCase()}`
        : "API health unavailable",
    ];
  }, [entries, requests, services]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Overview</h2>
        <p className="mt-1 text-sm text-white/35">
          Admin visibility across mandi prices, farmer activity, logistics, and API health.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Active Mandis" value={String(activeMandis)} icon={Store} />
        <KPICard
          title="Average Price"
          value={`Rs ${averagePrice.toLocaleString("en-IN")}`}
          icon={Wallet}
        />
        <KPICard title="Registered Farmers" value={String(farmers.length)} icon={Users} />
        <KPICard title="Open Transport Jobs" value={String(activeRequests)} icon={Truck} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartWrapper
          title="Price Trend"
          subtitle={loadingLiveData ? "Loading live mandi feed..." : "Platform price movement"}
        >
          <LineChartComponent data={priceTrendData} xKey="date" yKey="price" />
        </ChartWrapper>

        <ChartWrapper title="Requests by Region" subtitle="Transport demand concentration">
          <BarChartComponent data={logisticsRegionData} xKey="region" yKey="requests" />
        </ChartWrapper>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <ChartWrapper title="Crop Mix" subtitle="Commodities moving through the platform">
          <PieChartComponent data={cropDistributionData} />
        </ChartWrapper>

        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <h3 className="text-[15px] font-bold tracking-tight text-white">System Health</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="rounded-xl border border-white/[0.05] bg-black/20 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white/75">{service.name}</span>
                    <span
                      className={`text-xs font-semibold ${
                        service.status === "Active"
                          ? "text-emerald-400"
                          : service.status === "Degraded"
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {service.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-white/40">
                    <span>{service.latency} ms</span>
                    <span>{service.uptime}% uptime</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-emerald-500/15 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-200">
              Overall health score: {serviceHealth}%
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
            <h3 className="mb-4 text-[15px] font-bold tracking-tight text-white">Recent Activity</h3>
            <div className="space-y-2">
              {recentActivity.map((item) => (
                <div key={item} className="rounded-xl bg-black/20 px-4 py-3 text-sm text-white/65">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
