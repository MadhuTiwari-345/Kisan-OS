"use client";

import { Suspense, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Navigation,
  Plus,
  Route,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { logisticsApi } from "@/lib/api";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { useMilkRun, type FarmerLocation } from "@/hooks/useMilkRun";

type TabKey = "book" | "track" | "milkRun";

interface TransportItem {
  id: number | string;
  cropType: string;
  quantityKg: number;
  pickupLocation: string;
  destinationMandi: string;
  status: string;
  priceEstimate: number;
}

const fallbackRequests: TransportItem[] = [
  {
    id: "TRK-1001",
    cropType: "Onion",
    quantityKg: 2200,
    pickupLocation: "Rampur",
    destinationMandi: "Azadpur Mandi",
    status: "pending",
    priceEstimate: 1850,
  },
  {
    id: "TRK-1002",
    cropType: "Tomato",
    quantityKg: 1600,
    pickupLocation: "Kamalpur",
    destinationMandi: "Vashi Mandi",
    status: "confirmed",
    priceEstimate: 2400,
  },
];

function LogisticsContent() {
  const [activeTab, setActiveTab] = useState<TabKey>("book");
  const [requests, setRequests] = useState<TransportItem[]>(fallbackRequests);
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState<number | null>(null);
  const [form, setForm] = useState({
    cropType: "Onion",
    quantityKg: "1200",
    pickupLocation: "Rampur",
    destinationMandi: "Azadpur Mandi",
    truckType: "mini_truck",
  });
  const { location, refreshLocation } = useGeoLocation();
  const { result, farmers, addFarmer, removeFarmer, optimizeRoute, isOptimizing, reset } =
    useMilkRun();

  async function handleQuote() {
    try {
      const response = (await logisticsApi.getQuote(
        form.pickupLocation,
        form.destinationMandi,
        form.cropType,
        Number(form.quantityKg),
        form.truckType
      )) as { base_price: number };
      setQuote(Math.round(response.base_price));
    } catch {
      setQuote(Math.round(Number(form.quantityKg) * 1.2));
    }
  }

  async function handleBooking() {
    setSubmitting(true);
    try {
      const payload = {
        crop_type: form.cropType,
        quantity_kg: Number(form.quantityKg),
        pickup_location: form.pickupLocation,
        pickup_lat: location?.latitude,
        pickup_lng: location?.longitude,
        destination_mandi: form.destinationMandi,
        truck_type: form.truckType,
      };

      try {
        const created = (await logisticsApi.createRequest(payload)) as {
          id: number;
          crop_type: string;
          quantity_kg: number;
          pickup_location: string;
          destination_mandi: string;
          status: string;
          price_estimate?: number;
        };
        setRequests((current) => [
          {
            id: created.id,
            cropType: created.crop_type,
            quantityKg: created.quantity_kg,
            pickupLocation: created.pickup_location,
            destinationMandi: created.destination_mandi,
            status: created.status,
            priceEstimate: Math.round(created.price_estimate || 0),
          },
          ...current,
        ]);
      } catch {
        setRequests((current) => [
          {
            id: `TRK-${Date.now()}`,
            cropType: form.cropType,
            quantityKg: Number(form.quantityKg),
            pickupLocation: form.pickupLocation,
            destinationMandi: form.destinationMandi,
            status: "pending",
            priceEstimate: quote || Math.round(Number(form.quantityKg) * 1.2),
          },
          ...current,
        ]);
      }
    } finally {
      setSubmitting(false);
      setActiveTab("track");
    }
  }

  async function seedMilkRunPool() {
    await refreshLocation();
    const sampleFarmers: FarmerLocation[] = [
      {
        id: "farmer-1",
        name: "Ramesh Kumar",
        latitude: location?.latitude || 28.7041,
        longitude: location?.longitude || 77.1025,
        quantityKg: 700,
        cropType: "Onion",
      },
      {
        id: "farmer-2",
        name: "Suresh Patel",
        latitude: (location?.latitude || 28.7041) + 0.04,
        longitude: (location?.longitude || 77.1025) + 0.03,
        quantityKg: 650,
        cropType: "Onion",
      },
      {
        id: "farmer-3",
        name: "Anita Devi",
        latitude: (location?.latitude || 28.7041) + 0.08,
        longitude: (location?.longitude || 77.1025) + 0.04,
        quantityKg: 500,
        cropType: "Onion",
      },
    ];

    if (farmers.length === 0) {
      sampleFarmers.forEach((item) => addFarmer(item));
    }

    await optimizeRoute(
      farmers.length ? farmers : sampleFarmers,
      "Azadpur Mandi",
      5000,
      "Onion"
    );
  }

  const totals = useMemo(() => {
    return requests.reduce(
      (acc, item) => {
        acc.volume += item.quantityKg;
        acc.value += item.priceEstimate;
        if (item.status.toLowerCase().includes("confirm")) acc.confirmed += 1;
        return acc;
      },
      { volume: 0, value: 0, confirmed: 0 }
    );
  }, [requests]);

  return (
    <div className="app-screen min-h-screen pb-24">
      <header className="app-header sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dff8bc]/25 bg-[#dff8bc]/10">
              <Truck className="h-5 w-5 text-[#dff8bc]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Logistics</h1>
              <p className="text-xs text-white/45">Booking, tracking, and milk-run pooling</p>
            </div>
          </div>

            <button
              type="button"
              onClick={() => void refreshLocation()}
              className="app-button-secondary flex items-center gap-1 rounded-lg px-3 py-2 text-xs"
          >
            <MapPin className="h-3 w-3" />
            {location ? "GPS ready" : "Use GPS"}
          </button>
        </div>
      </header>

      <div className="flex gap-2 px-4 py-4">
        {[
          { key: "book", label: "Book" },
          { key: "track", label: "Track" },
          { key: "milkRun", label: "Milk-Run" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as TabKey)}
            className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium ${
              activeTab === tab.key
                ? "border border-[#dff8bc]/30 bg-[#dff8bc]/10 text-[#dff8bc]"
                : "border border-white/10 bg-white/5 text-white/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "book" && (
        <div className="space-y-4 px-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-center">
              <Truck className="mx-auto mb-2 h-5 w-5 text-blue-300" />
              <p className="text-lg font-bold text-white">{requests.length}</p>
              <p className="text-[11px] text-white/40">Requests</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-emerald-300" />
              <p className="text-lg font-bold text-white">{totals.confirmed}</p>
              <p className="text-[11px] text-white/40">Confirmed</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-center">
              <Navigation className="mx-auto mb-2 h-5 w-5 text-primary" />
              <p className="text-lg font-bold text-white">Rs {totals.value.toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-white/40">Transport value</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <h2 className="mb-4 text-base font-semibold text-white">Create Transport Request</h2>
            <div className="space-y-3">
              <input
                value={form.cropType}
                onChange={(event) => setForm((current) => ({ ...current, cropType: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                placeholder="Crop type"
              />
              <input
                value={form.quantityKg}
                onChange={(event) =>
                  setForm((current) => ({ ...current, quantityKg: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                placeholder="Quantity in kg"
                type="number"
              />
              <input
                value={form.pickupLocation}
                onChange={(event) =>
                  setForm((current) => ({ ...current, pickupLocation: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                placeholder="Pickup village"
              />
              <input
                value={form.destinationMandi}
                onChange={(event) =>
                  setForm((current) => ({ ...current, destinationMandi: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                placeholder="Destination mandi"
              />
              <select
                value={form.truckType}
                onChange={(event) =>
                  setForm((current) => ({ ...current, truckType: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              >
                <option value="mini_truck">Mini truck</option>
                <option value="tempo">Tempo</option>
                <option value="truck">Truck</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            {quote !== null && (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Estimated shared quote: Rs {quote.toLocaleString("en-IN")}
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => void handleQuote()}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/75"
              >
                Get Quote
              </button>
              <button
                type="button"
                onClick={() => void handleBooking()}
                disabled={submitting}
                className="flex-1 rounded-xl border border-primary/30 bg-primary/20 py-3 text-sm font-semibold text-primary"
              >
                {submitting ? "Submitting..." : "Book Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "track" && (
        <div className="space-y-3 px-4">
          {requests.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/8 bg-white/5 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {item.cropType} · {item.quantityKg} kg
                  </p>
                  <p className="text-xs text-white/40">{item.id}</p>
                </div>
                <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium capitalize text-blue-300">
                  {item.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-white/65">
                <MapPin className="h-4 w-4 text-white/35" />
                <span>{item.pickupLocation}</span>
                <ArrowRight className="h-3 w-3 text-white/30" />
                <span>{item.destinationMandi}</span>
              </div>

              <div className="mt-3 text-sm text-white/50">
                Estimated price Rs {item.priceEstimate.toLocaleString("en-IN")}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === "milkRun" && (
        <div className="space-y-4 px-4">
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Milk-Run Optimizer</h2>
                <p className="text-xs text-white/45">Cluster nearby farmers into one route</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void seedMilkRunPool()}
                disabled={isOptimizing}
                className="app-button-primary flex-1 rounded-xl py-3 text-sm font-semibold"
              >
                {isOptimizing ? "Optimizing..." : "Run Optimization"}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
              >
                Reset
              </button>
            </div>
          </div>

          {farmers.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Farmer Pool</h3>
                <button
                  type="button"
                  onClick={() =>
                    addFarmer({
                      id: `farmer-${Date.now()}`,
                      name: "New Farmer",
                      latitude: (location?.latitude || 28.7041) + 0.02,
                      longitude: (location?.longitude || 77.1025) + 0.02,
                      quantityKg: 400,
                      cropType: "Onion",
                    })
                  }
                  className="flex items-center gap-1 text-xs text-primary"
                >
                  <Plus className="h-3 w-3" />
                  Add farmer
                </button>
              </div>

              <div className="space-y-2">
                {farmers.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-white/45">
                        {item.quantityKg} kg · {item.cropType}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFarmer(item.id)}
                      className="text-xs text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-200">
                    <Zap className="h-4 w-4" />
                    Savings unlocked
                  </div>
                  <span className="text-2xl font-bold text-emerald-200">
                    {result.savingsPercentage}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-white/45">Distance</p>
                    <p className="font-semibold text-white">{result.totalDistanceKm} km</p>
                  </div>
                  <div>
                    <p className="text-white/45">Cost</p>
                    <p className="font-semibold text-white">
                      Rs {result.estimatedCost.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/45">Per farmer</p>
                    <p className="font-semibold text-white">
                      Rs {result.costPerFarmer.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <Route className="h-4 w-4 text-primary" />
                  Optimized Route
                </div>
                <div className="space-y-2">
                  {result.optimizedRoute.map((stop) => (
                    <div
                      key={`${stop.stop}-${stop.latitude}-${stop.longitude}`}
                      className="rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/75"
                    >
                      Stop {stop.stop} · {stop.type === "pickup" ? stop.farmerName : "Destination"}
                      <div className="mt-1 text-xs text-white/45">
                        +{stop.distanceFromPrevKm} km from previous stop
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <nav className="app-bottom-nav fixed bottom-0 left-0 right-0 lg:hidden">
        <div className="flex items-center justify-around py-2 text-[10px]">
          <a href="/dashboard" className="flex flex-col items-center gap-1 px-4 py-2 text-white/45">
            <Truck className="h-5 w-5" />
            Home
          </a>
          <a href="/market" className="flex flex-col items-center gap-1 px-4 py-2 text-white/45">
            <MapPin className="h-5 w-5" />
            Market
          </a>
          <a href="/logistics" className="flex flex-col items-center gap-1 px-4 py-2 text-primary">
            <Truck className="h-5 w-5" />
            Transport
          </a>
          <a href="/advisory" className="flex flex-col items-center gap-1 px-4 py-2 text-white/45">
            <Navigation className="h-5 w-5" />
            Advisory
          </a>
        </div>
      </nav>
    </div>
  );
}

export default function LogisticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-white/40">
          Loading logistics...
        </div>
      }
    >
      <LogisticsContent />
    </Suspense>
  );
}
