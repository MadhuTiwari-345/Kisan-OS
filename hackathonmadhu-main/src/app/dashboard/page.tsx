"use client";

import Link from "next/link";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bot,
  BrainCircuit,
  CircleDollarSign,
  Leaf,
  Mic,
  Package,
  ShoppingBag,
  Sparkles,
  Tractor,
  Truck,
  User,
} from "lucide-react";

import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { useBackgroundSync } from "@/hooks/useBackgroundSync";
import { useBhashiniFull } from "@/hooks/useBhashiniFull";
import {
  advisoryApi,
  aiApi,
  logisticsApi,
  marketApi,
  ordersApi,
  type AdvisoryHistoryItem,
  type DemandForecastItem,
  type MarketPrice,
  type OrderRecord,
  type PricePredictionResponse,
  type TransportRequest,
} from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

function routeForRole(role?: string) {
  if (role === "buyer") return "/marketplace";
  if (role === "logistics") return "/logistics";
  return "/dashboard";
}

export default function DashboardPage() {
  const router = useRouter();
  const { hasHydrated, user, isAuthenticated, checkAuth } = useAuthStore();
  const { pendingCount, lastSyncTime, syncNow } = useBackgroundSync();
  const { isListening, isProcessing, transcript, startListening, stopListening } = useBhashiniFull();

  const [marketRows, setMarketRows] = useState<MarketPrice[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [advisoryItems, setAdvisoryItems] = useState<AdvisoryHistoryItem[]>([]);
  const [transportRequests, setTransportRequests] = useState<TransportRequest[]>([]);
  const [prediction, setPrediction] = useState<PricePredictionResponse | null>(null);
  const [demand, setDemand] = useState<DemandForecastItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    void checkAuth().finally(() => setIsBootstrapping(false));
  }, [checkAuth, hasHydrated, router]);

  const hydrateDashboard = useCallback(async () => {
    const state = useAuthStore.getState();
    const currentUser = state.user;
    if (!state.isAuthenticated || !currentUser) return;

    try {
      const leadCrop = currentUser.primary_crops?.[0] || "onion";
      const [marketFeed, orderFeed, advisoryFeed, transportFeed, forecast, pricePrediction] =
        await Promise.all([
          marketApi.getPrices(leadCrop, currentUser.state || undefined, 5),
          ordersApi.getByUser(currentUser.id),
          advisoryApi.getHistory(4),
          logisticsApi.getHistory(4),
          aiApi.demandForecast(undefined, 14),
          aiApi.pricePrediction(leadCrop, {
            state: currentUser.state || undefined,
            season: "rabi",
            demand_score: 0.72,
            weather_risk: 0.18,
          }),
        ]);

      setMarketRows(marketFeed.prices || []);
      setOrders(orderFeed.items || []);
      setAdvisoryItems(advisoryFeed.items || []);
      setTransportRequests(transportFeed.requests || []);
      setDemand(forecast.items || []);
      setPrediction(pricePrediction);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user) return;
    startTransition(() => {
      void hydrateDashboard();
    });
  }, [hasHydrated, hydrateDashboard, isAuthenticated, user]);

  const heroMetrics = useMemo(() => {
    const pendingPayments = orders.filter((item) => item.payment_status !== "paid").length;
    const activeTrips = transportRequests.filter((item) =>
      ["pending", "pooled", "confirmed", "in_transit"].includes(item.status)
    ).length;
    const averageMarketPrice =
      marketRows.length > 0
        ? marketRows.reduce((sum, row) => sum + row.price_per_kg, 0) / marketRows.length
        : 0;
    return {
      pendingPayments,
      activeTrips,
      averageMarketPrice,
    };
  }, [marketRows, orders, transportRequests]);

  const quickActions =
    user?.role === "buyer"
      ? [
          { href: "/marketplace", label: "Browse listings", icon: ShoppingBag },
          { href: "/market", label: "Compare mandi prices", icon: CircleDollarSign },
          { href: "/profile", label: "Update buyer profile", icon: User },
        ]
      : [
          { href: "/marketplace", label: "Publish crop listing", icon: Package },
          { href: "/logistics", label: "Book logistics", icon: Truck },
          { href: "/advisory", label: "Ask AI advisory", icon: BrainCircuit },
        ];

  if (!hasHydrated || isBootstrapping) {
    return (
      <div className="app-screen flex min-h-screen items-center justify-center px-6 text-white">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[rgba(8,18,14,0.72)] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <p className="app-kicker">Loading workspace</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white">Preparing your command center</h1>
          <p className="mt-4 text-sm leading-7 text-white/62">
            Validating your session and loading market, logistics, and advisory data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-screen pb-24 text-white">
      <OfflineIndicator pendingCount={pendingCount} lastSyncTime={lastSyncTime} onSync={syncNow} />

      <header className="app-header sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="app-kicker">Live operating console</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              {user?.role === "buyer" ? "Buyer command center" : "Farmer command center"}
            </h1>
            <p className="mt-2 text-sm text-white/62">
              {user ? `${user.name} • ${user.location || user.state || "KISAN-OS"}` : "Loading account"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => (isListening ? stopListening() : startListening())}
              className="app-button-secondary flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
            >
              <Mic className="h-4 w-4" />
              {isListening ? "Stop voice" : "Start voice"}
            </button>
            <Link href={user?.role === "admin" ? "/admin" : routeForRole(user?.role)} className="hidden sm:block">
              <span className="app-button-primary inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold">
                Open workflow
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="app-panel rounded-[2rem] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.28em] text-[#dff8bc]/70">
                  Unified platform
                </p>
                <h2 className="mt-3 text-4xl font-black leading-tight text-white">
                  {user?.role === "buyer"
                    ? "Procure smarter with transparent bids and AI pricing."
                    : "Sell smarter with transparent prices, demand signals, and faster logistics."}
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/62">
                  Live mandi intelligence, AI price forecasting, order tracking, digital transactions,
                  and multilingual support are all connected to the same backend.
                </p>
              </div>

              <div className="grid min-w-[260px] gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="app-stat rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/42">Avg mandi price</p>
                  <p className="mt-3 text-2xl font-black text-white">
                    Rs {heroMetrics.averageMarketPrice.toFixed(2)}
                  </p>
                </div>
                <div className="app-stat rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/42">Pending payments</p>
                  <p className="mt-3 text-2xl font-black text-white">{heroMetrics.pendingPayments}</p>
                </div>
                <div className="app-stat rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/42">Active trips</p>
                  <p className="mt-3 text-2xl font-black text-white">{heroMetrics.activeTrips}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/8 bg-black/18 p-4 text-sm text-white/62">
              {isListening
                ? `Listening: ${transcript || "Speak in your preferred language..." }`
                : isProcessing
                  ? "Processing voice input..."
                  : "Voice workflows use the 22-language catalog locally. Hosted speech keys are optional, not required for the current setup."}
            </div>
          </div>

          <div className="app-panel-soft rounded-[2rem] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-[#dff8bc]/18 bg-[#dff8bc]/10 p-3">
                <Sparkles className="h-5 w-5 text-[#dff8bc]" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/42">AI price call</p>
                <h3 className="text-xl font-black text-white">Recommended sell window</h3>
              </div>
            </div>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/42">Predicted price</p>
                <p className="mt-3 text-3xl font-black text-white">
                  Rs {prediction?.predicted_price_per_kg?.toFixed(2) || "--"}/kg
                </p>
                <p className="mt-2 text-sm text-white/56">
                  {prediction?.basis || "Waiting for forecast model output"}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/42">Trend</p>
                  <p className="mt-2 text-lg font-bold capitalize text-white">
                    {prediction?.trend || "stable"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/42">Confidence</p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {prediction ? `${Math.round(prediction.confidence * 100)}%` : "--"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="app-panel-soft rounded-3xl p-5 transition-transform hover:-translate-y-0.5">
              <action.icon className="h-5 w-5 text-[#dff8bc]" />
              <h3 className="mt-4 text-lg font-bold text-white">{action.label}</h3>
              <p className="mt-2 text-sm text-white/56">Jump directly into the live workflow.</p>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
          <div className="app-panel-soft rounded-[2rem] p-6">
            <div className="mb-4 flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-[#dff8bc]" />
              <h3 className="text-lg font-bold text-white">Live market feed</h3>
            </div>
            <div className="space-y-3">
              {marketRows.slice(0, 4).map((row) => (
                <div key={`${row.mandi}-${row.crop_name}-${row.price_date}`} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold capitalize text-white">{row.crop_name}</p>
                      <p className="text-xs text-white/46">
                        {row.mandi} • {row.state}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-white">Rs {row.price_per_kg.toFixed(2)}</p>
                      <p className="text-xs capitalize text-white/50">{row.trend}</p>
                    </div>
                  </div>
                </div>
              ))}
              {marketRows.length === 0 && <p className="text-sm text-white/46">No market records yet.</p>}
            </div>
          </div>

          <div className="app-panel-soft rounded-[2rem] p-6">
            <div className="mb-4 flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#dff8bc]" />
              <h3 className="text-lg font-bold text-white">AI demand forecast</h3>
            </div>
            <div className="space-y-3">
              {demand.slice(0, 4).map((item) => (
                <div key={item.crop} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold capitalize text-white">{item.crop}</p>
                      <p className="mt-1 text-xs text-white/50">{item.best_action}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#dff8bc]">
                      {item.demand_signal}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-white/40">Projected demand</p>
                      <p className="font-bold text-white">{Math.round(item.projected_demand_kg)} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Planting signal</p>
                      <p className="font-bold text-white">{item.planting_signal}</p>
                    </div>
                  </div>
                </div>
              ))}
              {demand.length === 0 && <p className="text-sm text-white/46">No demand forecast available.</p>}
            </div>
          </div>

          <div className="app-panel-soft rounded-[2rem] p-6">
            <div className="mb-4 flex items-center gap-2">
              <Leaf className="h-4 w-4 text-[#dff8bc]" />
              <h3 className="text-lg font-bold text-white">Recent advisory + orders</h3>
            </div>
            <div className="space-y-3">
              {advisoryItems.slice(0, 2).map((item) => (
                <div key={`${item.query}-${item.created_at}`} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">{item.crop || "advisory"}</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">{item.response}</p>
                </div>
              ))}
              {orders.slice(0, 2).map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.buyer_name}</p>
                      <p className="text-xs text-white/46">
                        Order #{item.id} • {item.quantity_kg} kg
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#dff8bc]">
                      {item.payment_status}
                    </span>
                  </div>
                </div>
              ))}
              {advisoryItems.length === 0 && orders.length === 0 && (
                <p className="text-sm text-white/46">No recent activity yet.</p>
              )}
            </div>
          </div>
        </section>
      </main>

      <nav className="app-bottom-nav fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-around px-4 py-3">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[#dff8bc]">
            <Tractor className="h-5 w-5" />
            <span className="text-[11px]">Home</span>
          </Link>
          <Link href="/market" className="flex flex-col items-center gap-1 text-white/48 hover:text-white">
            <CircleDollarSign className="h-5 w-5" />
            <span className="text-[11px]">Market</span>
          </Link>
          <Link href="/marketplace" className="flex flex-col items-center gap-1 text-white/48 hover:text-white">
            <ShoppingBag className="h-5 w-5" />
            <span className="text-[11px]">Exchange</span>
          </Link>
          <Link href="/logistics" className="flex flex-col items-center gap-1 text-white/48 hover:text-white">
            <Truck className="h-5 w-5" />
            <span className="text-[11px]">Logistics</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 text-white/48 hover:text-white">
            <User className="h-5 w-5" />
            <span className="text-[11px]">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
