"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  LineChart,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Wheat,
} from "lucide-react";

import { aiApi, marketApi, type MarketPrice, type PriceComparison, type PricePredictionResponse } from "@/lib/api";

const CROPS = ["wheat", "rice", "tomato", "onion", "potato", "cotton", "soybean", "mustard"];

function MarketContent() {
  const [selectedCrop, setSelectedCrop] = useState("onion");
  const [selectedState, setSelectedState] = useState("");
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [comparison, setComparison] = useState<PriceComparison | null>(null);
  const [prediction, setPrediction] = useState<PricePredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadMarketIntel() {
    try {
      setLoading(true);
      const [priceFeed, compareFeed, predictionFeed] = await Promise.all([
        marketApi.getPrices(selectedCrop, selectedState || undefined, 7),
        marketApi.comparePrices(selectedCrop),
        aiApi.pricePrediction(selectedCrop, {
          state: selectedState || undefined,
          season: "rabi",
          demand_score: 0.7,
          weather_risk: 0.16,
        }),
      ]);
      setPrices(priceFeed.prices || []);
      setComparison(compareFeed);
      setPrediction(predictionFeed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load market intelligence.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMarketIntel();
  }, [selectedCrop, selectedState]);

  const marketSummary = useMemo(() => {
    const averagePrice =
      prices.length > 0 ? prices.reduce((sum, item) => sum + item.price_per_kg, 0) / prices.length : 0;
    const bestPrice =
      prices.length > 0 ? Math.max(...prices.map((item) => item.price_per_kg)) : 0;
    return { averagePrice, bestPrice };
  }, [prices]);

  return (
    <div className="app-screen min-h-screen pb-24 text-white">
      <header className="app-header sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <span className="app-kicker">Market radar</span>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Live mandi intelligence</h1>
            <p className="mt-2 text-sm text-white/60">
              Compare mandi prices, identify the best market, and read AI-supported selling signals.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadMarketIntel()}
            className="app-button-secondary flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="app-panel rounded-[2rem] p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/46">Crop</label>
              <select
                value={selectedCrop}
                onChange={(event) => setSelectedCrop(event.target.value)}
                className="app-select"
              >
                {CROPS.map((crop) => (
                  <option key={crop} value={crop} className="bg-[#102019]">
                    {crop}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/46">State filter</label>
              <input
                value={selectedState}
                onChange={(event) => setSelectedState(event.target.value)}
                className="app-input"
                placeholder="Optional state filter"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="app-stat rounded-2xl p-4">
                <p className="text-xs text-white/42">Avg price</p>
                <p className="mt-2 text-2xl font-black text-white">
                  Rs {marketSummary.averagePrice.toFixed(2)}
                </p>
              </div>
              <div className="app-stat rounded-2xl p-4">
                <p className="text-xs text-white/42">Best spot price</p>
                <p className="mt-2 text-2xl font-black text-white">Rs {marketSummary.bestPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="app-panel-soft rounded-[2rem] p-6">
            <div className="mb-5 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#dff8bc]" />
              <h2 className="text-xl font-black text-white">Best mandi comparison</h2>
            </div>
            {comparison ? (
              <>
                <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/42">Top recommendation</p>
                  <h3 className="mt-3 text-3xl font-black text-white">{comparison.best_mandi}</h3>
                  <p className="mt-2 text-sm text-white/64">{comparison.recommendation}</p>
                  <div className="mt-4 flex items-center gap-3 text-sm text-white/70">
                    <MapPin className="h-4 w-4 text-[#dff8bc]" />
                    Rs {comparison.best_price.toFixed(2)}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {comparison.markets.slice(0, 5).map((item) => (
                    <div key={`${item.mandi}-${item.price_date}`} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{item.mandi}</p>
                          <p className="text-xs text-white/46">{item.state}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-white">Rs {item.price_per_kg.toFixed(2)}</p>
                          <p className="text-xs capitalize text-white/46">{item.trend}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-sm text-white/46">{loading ? "Loading comparison..." : "No comparison available."}</div>
            )}
          </div>

          <div className="app-panel-soft rounded-[2rem] p-6">
            <div className="mb-5 flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#dff8bc]" />
              <h2 className="text-xl font-black text-white">AI prediction layer</h2>
            </div>
            <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/42">Predicted mandi price</p>
              <p className="mt-3 text-4xl font-black text-white">
                Rs {prediction?.predicted_price_per_kg?.toFixed(2) || "--"}
              </p>
              <p className="mt-2 text-sm text-white/60">{prediction?.basis || "Prediction not available."}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <p className="text-xs text-white/42">Trend</p>
                  <p className="mt-2 text-lg font-bold capitalize text-white">{prediction?.trend || "stable"}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <p className="text-xs text-white/42">Confidence</p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {prediction ? `${Math.round(prediction.confidence * 100)}%` : "--"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-white/8 bg-black/20 p-5">
              <div className="mb-3 flex items-center gap-2">
                <LineChart className="h-4 w-4 text-[#dff8bc]" />
                <p className="text-sm font-semibold text-white">Quick interpretation</p>
              </div>
              <p className="text-sm leading-7 text-white/66">
                {prediction
                  ? `The model suggests a ${prediction.trend} market for ${prediction.crop}. Recommended farmer price is Rs ${prediction.recommended_price_per_kg.toFixed(2)} per kg.`
                  : "Select a crop to load the AI recommendation layer."}
              </p>
            </div>
          </div>
        </section>

        <section className="app-panel-soft rounded-[2rem] p-6">
          <div className="mb-5 flex items-center gap-2">
            <Wheat className="h-4 w-4 text-[#dff8bc]" />
            <h2 className="text-xl font-black text-white">Price records</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-white/46">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading price records...
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {prices.map((item) => (
                <div key={`${item.mandi}-${item.price_date}`} className="rounded-[1.5rem] border border-white/8 bg-black/18 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-white">{item.mandi}</p>
                      <p className="text-xs text-white/46">{item.state}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#dff8bc]" />
                  </div>
                  <p className="mt-4 text-3xl font-black text-white">Rs {item.price_per_kg.toFixed(2)}</p>
                  <p className="mt-1 text-xs text-white/46">Arrival {item.arrival_tons ?? 0} tons</p>
                  <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.18em] text-[#dff8bc]">
                    {item.trend || "stable"}
                  </div>
                </div>
              ))}
              {prices.length === 0 && <p className="text-sm text-white/46">No mandi prices found.</p>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function MarketPage() {
  return (
    <Suspense
      fallback={
        <div className="app-screen flex min-h-screen items-center justify-center text-white/46">
          Loading market radar...
        </div>
      }
    >
      <MarketContent />
    </Suspense>
  );
}
