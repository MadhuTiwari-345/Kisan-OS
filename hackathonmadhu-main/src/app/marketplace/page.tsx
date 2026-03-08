"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeIndianRupee,
  CheckCheck,
  CircleDollarSign,
  Gavel,
  Loader2,
  Package,
  Plus,
  ShoppingBag,
  Sprout,
  Store,
} from "lucide-react";

import {
  listingsApi,
  ordersApi,
  type BidRecord,
  type Listing,
  type OrderRecord,
} from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export default function MarketplacePage() {
  const { user } = useAuthStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingBids, setListingBids] = useState<Record<number, BidRecord[]>>({});
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    crop_name: "onion",
    category: "vegetable",
    season: "rabi",
    quantity_kg: 1200,
    price_per_kg: 19.5,
    mandi_name: "Azadpur Mandi",
  });

  const isFarmerView = user?.role === "farmer" || user?.role === "admin";
  const isBuyerView = user?.role === "buyer" || user?.role === "admin";

  const loadMarketplace = useCallback(async () => {
    try {
      setLoading(true);
      const listingResult = await listingsApi.list();
      setListings(listingResult.items);

      if (user) {
        const orderResult = await ordersApi.getByUser(user.id);
        setOrders(orderResult.items);
      } else {
        setOrders([]);
      }

      if (user && isFarmerView) {
        const ownedListings = listingResult.items.filter((item) => item.farmer_id === user.id);
        const bidResults = await Promise.all(
          ownedListings.map(async (item) => ({
            listingId: item.id,
            bids: (await listingsApi.listBids(item.id)).items,
          }))
        );
        setListingBids(
          bidResults.reduce<Record<number, BidRecord[]>>((acc, item) => {
            acc[item.listingId] = item.bids;
            return acc;
          }, {})
        );
      } else {
        setListingBids({});
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load marketplace data.");
    } finally {
      setLoading(false);
    }
  }, [isFarmerView, user]);

  useEffect(() => {
    void loadMarketplace();
  }, [loadMarketplace]);

  const myListings = useMemo(
    () => listings.filter((item) => item.farmer_id === user?.id),
    [listings, user?.id]
  );

  const marketplaceStats = useMemo(() => {
    const activeListings = listings.filter((item) => item.status === "active");
    return {
      totalListings: listings.length,
      activeListings: activeListings.length,
      averagePrice:
        activeListings.length > 0
          ? activeListings.reduce((sum, item) => sum + item.price_per_kg, 0) / activeListings.length
          : 0,
      pendingPayments: orders.filter((item) => item.payment_status !== "paid").length,
    };
  }, [listings, orders]);

  async function handleCreateListing() {
    setSubmitting(true);
    setActionMessage(null);
    try {
      await listingsApi.create({
        ...form,
        location: user?.location || undefined,
      });
      await loadMarketplace();
      setActionMessage("Listing published successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish listing.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePlaceBid(listing: Listing) {
    setSubmitting(true);
    setActionMessage(null);
    try {
      await listingsApi.createBid(listing.id, {
        quantity_kg: Math.min(500, listing.quantity_kg),
        bid_price_per_kg: Number((listing.price_per_kg * 1.03).toFixed(2)),
        note: "Buyer-side fast procurement offer",
      });
      await loadMarketplace();
      setActionMessage(`Bid submitted on ${listing.crop_name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place bid.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDirectOrder(listing: Listing) {
    setSubmitting(true);
    setActionMessage(null);
    try {
      await ordersApi.create(listing.id, Math.min(300, listing.quantity_kg));
      await loadMarketplace();
      setActionMessage(`Order placed for ${listing.crop_name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAcceptBid(listingId: number, bidId: number) {
    setSubmitting(true);
    setActionMessage(null);
    try {
      await listingsApi.acceptBid(listingId, bidId);
      await loadMarketplace();
      setActionMessage("Bid accepted and order created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept bid.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePay(orderId: number) {
    setSubmitting(true);
    setActionMessage(null);
    try {
      await ordersApi.pay(orderId, { payment_method: "upi" });
      await loadMarketplace();
      setActionMessage(`Payment completed for order #${orderId}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete payment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-screen min-h-screen pb-24 text-white">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <section className="app-panel rounded-[2rem] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="app-kicker">Smart crop marketplace</span>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
                Transparent listings, bids, orders, and digital payments
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/62">
                Farmers can list crops and review buyer bids. Buyers can compare live inventory,
                place bids, purchase directly, and settle pending orders from the same exchange.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="app-stat rounded-2xl p-4">
                <p className="text-xs text-white/42">Listings</p>
                <p className="mt-2 text-2xl font-black text-white">{marketplaceStats.totalListings}</p>
              </div>
              <div className="app-stat rounded-2xl p-4">
                <p className="text-xs text-white/42">Active</p>
                <p className="mt-2 text-2xl font-black text-white">{marketplaceStats.activeListings}</p>
              </div>
              <div className="app-stat rounded-2xl p-4">
                <p className="text-xs text-white/42">Avg price</p>
                <p className="mt-2 text-2xl font-black text-white">
                  Rs {marketplaceStats.averagePrice.toFixed(2)}
                </p>
              </div>
              <div className="app-stat rounded-2xl p-4">
                <p className="text-xs text-white/42">Pending pay</p>
                <p className="mt-2 text-2xl font-black text-white">{marketplaceStats.pendingPayments}</p>
              </div>
            </div>
          </div>
        </section>

        {(error || actionMessage) && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              error
                ? "border border-red-400/20 bg-red-500/10 text-red-200"
                : "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {error || actionMessage}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          {isFarmerView && (
            <div className="app-panel-soft rounded-[2rem] p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <Plus className="h-5 w-5 text-[#dff8bc]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Create listing</h2>
                  <p className="text-sm text-white/46">Publish produce into the marketplace feed.</p>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  value={form.crop_name}
                  onChange={(event) => setForm((current) => ({ ...current, crop_name: event.target.value }))}
                  className="app-input"
                  placeholder="Crop name"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    className="app-input"
                    placeholder="Category"
                  />
                  <input
                    value={form.season}
                    onChange={(event) => setForm((current) => ({ ...current, season: event.target.value }))}
                    className="app-input"
                    placeholder="Season"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="number"
                    value={form.quantity_kg}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, quantity_kg: Number(event.target.value) }))
                    }
                    className="app-input"
                    placeholder="Quantity (kg)"
                  />
                  <input
                    type="number"
                    value={form.price_per_kg}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, price_per_kg: Number(event.target.value) }))
                    }
                    className="app-input"
                    placeholder="Price per kg"
                  />
                </div>
                <input
                  value={form.mandi_name}
                  onChange={(event) => setForm((current) => ({ ...current, mandi_name: event.target.value }))}
                  className="app-input"
                  placeholder="Target mandi"
                />
                <button
                  type="button"
                  onClick={() => void handleCreateListing()}
                  disabled={submitting}
                  className="app-button-primary flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold disabled:opacity-65"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                  Publish listing
                </button>
              </div>
            </div>
          )}

          <div className="app-panel-soft rounded-[2rem] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Live listings</h2>
                <p className="text-sm text-white/46">Shared crop inventory for farmers and buyers.</p>
              </div>
              <button
                type="button"
                onClick={() => void loadMarketplace()}
                className="app-button-secondary rounded-2xl px-4 py-2 text-sm font-semibold"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-white/42">Loading exchange...</div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {listings.map((listing) => {
                  const ownBids = listingBids[listing.id] || [];
                  const isMine = listing.farmer_id === user?.id;
                  return (
                    <div key={listing.id} className="rounded-[1.5rem] border border-white/8 bg-black/18 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            {isMine ? (
                              <Sprout className="h-4 w-4 text-[#dff8bc]" />
                            ) : (
                              <Store className="h-4 w-4 text-[#dff8bc]" />
                            )}
                            <h3 className="text-lg font-bold capitalize text-white">{listing.crop_name}</h3>
                          </div>
                          <p className="mt-1 text-xs text-white/46">
                            {listing.category || "crop"} • {listing.season || "season not set"}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#dff8bc]">
                          {listing.status}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                          <p className="text-xs text-white/40">Quantity</p>
                          <p className="mt-2 text-lg font-black text-white">{listing.quantity_kg} kg</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                          <p className="text-xs text-white/40">Price</p>
                          <p className="mt-2 text-lg font-black text-white">Rs {listing.price_per_kg}/kg</p>
                        </div>
                      </div>

                      <p className="mt-4 text-xs text-white/48">
                        {listing.mandi_name} • {listing.location || "Location pending"}
                      </p>

                      {isBuyerView && !isMine && listing.status === "active" && (
                        <div className="mt-4 grid gap-3">
                          <button
                            type="button"
                            onClick={() => void handlePlaceBid(listing)}
                            disabled={submitting}
                            className="app-button-secondary flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
                          >
                            <Gavel className="h-4 w-4" />
                            Place bid
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDirectOrder(listing)}
                            disabled={submitting}
                            className="app-button-primary flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold"
                          >
                            <ShoppingBag className="h-4 w-4" />
                            Buy now
                          </button>
                        </div>
                      )}

                      {isMine && ownBids.length > 0 && (
                        <div className="mt-5 space-y-3 border-t border-white/8 pt-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-white/42">Open bids</p>
                          {ownBids.slice(0, 3).map((bid) => (
                            <div key={bid.id} className="rounded-2xl border border-white/8 bg-white/5 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-white">
                                    {bid.quantity_kg} kg at Rs {bid.bid_price_per_kg}/kg
                                  </p>
                                  <p className="text-xs text-white/46">{bid.note || "No note attached"}</p>
                                </div>
                                {bid.status === "open" ? (
                                  <button
                                    type="button"
                                    onClick={() => void handleAcceptBid(listing.id, bid.id)}
                                    disabled={submitting}
                                    className="app-button-primary rounded-xl px-3 py-2 text-xs font-bold"
                                  >
                                    Accept
                                  </button>
                                ) : (
                                  <span className="text-xs uppercase tracking-[0.18em] text-[#dff8bc]">
                                    {bid.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="app-panel-soft rounded-[2rem] p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <BadgeIndianRupee className="h-5 w-5 text-[#dff8bc]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Payments queue</h2>
                <p className="text-sm text-white/46">Buyer-side checkout and transparent settlement.</p>
              </div>
            </div>

            <div className="space-y-3">
              {orders.slice(0, 6).map((order) => (
                <div key={order.id} className="rounded-[1.5rem] border border-white/8 bg-black/18 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Order #{order.id} • {order.quantity_kg} kg
                      </p>
                      <p className="text-xs text-white/46">
                        {order.buyer_name} • Rs {order.total_amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#dff8bc]">
                      {order.payment_status}
                    </span>
                  </div>

                  {isBuyerView && order.payment_status !== "paid" && (
                    <button
                      type="button"
                      onClick={() => void handlePay(order.id)}
                      disabled={submitting}
                      className="app-button-primary mt-4 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold"
                    >
                      <CircleDollarSign className="h-4 w-4" />
                      Pay now
                    </button>
                  )}
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-sm text-white/46">No marketplace orders yet.</p>
              )}
            </div>
          </div>

          <div className="app-panel-soft rounded-[2rem] p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <CheckCheck className="h-5 w-5 text-[#dff8bc]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Your marketplace panel</h2>
                <p className="text-sm text-white/46">Role-specific shortcuts into live workflows.</p>
              </div>
            </div>

            <div className="space-y-3">
              {isFarmerView && (
                <div className="rounded-[1.5rem] border border-white/8 bg-black/18 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/42">Farmer side</p>
                  <p className="mt-2 text-sm text-white/70">
                    You currently have {myListings.length} listings in the exchange.
                  </p>
                </div>
              )}
              {isBuyerView && (
                <div className="rounded-[1.5rem] border border-white/8 bg-black/18 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/42">Buyer side</p>
                  <p className="mt-2 text-sm text-white/70">
                    Browse listings, bid fast, and settle transparent transactions without leaving the exchange.
                  </p>
                </div>
              )}

              <Link href="/market" className="app-button-secondary flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold">
                Open mandi comparison
                <CircleDollarSign className="h-4 w-4" />
              </Link>
              <Link href="/dashboard" className="app-button-secondary flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold">
                Back to dashboard
                <Sprout className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
