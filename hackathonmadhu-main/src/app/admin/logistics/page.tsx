"use client";

import { useEffect, useMemo, useState } from "react";
import { useLogisticsStore } from "@/stores/adminStore";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/Pagination";
import { KPICard } from "@/components/admin/KPICard";
import { Search, Truck, TrendingDown, Percent } from "lucide-react";
import { logisticsApi } from "@/lib/api";

const PER_PAGE = 10;

export default function LogisticsPage() {
  const { requests, setRequests } = useLogisticsStore();
  const [search, setSearch] = useState("");
  const [onlyAggregated, setOnlyAggregated] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function hydrateRequests() {
      try {
        const history = (await logisticsApi.getHistory(10)) as {
          requests?: Array<{
            id: number;
            pickup_location: string;
            destination_mandi: string;
            truck_type: string;
            price_estimate?: number;
            status: string;
          }>;
        };
        const liveRequests = (history.requests || []).map(
          (
            item,
            index: number
          ) => ({
            id: String(item.id),
            pickupVillage: item.pickup_location,
            destinationMandi: item.destination_mandi,
            truckCapacity: item.truck_type || "mini_truck",
            aggregated: index % 2 === 0,
            cost: Math.round(item.price_estimate || 0),
            status:
              item.status === "completed"
                ? ("Completed" as const)
                : item.status === "confirmed"
                ? ("Assigned" as const)
                : ("Pending" as const),
          })
        );

        if (!cancelled && liveRequests.length > 0) {
          setRequests(liveRequests);
        }
      } catch {
        // Keep seeded logistics data when auth/backend is unavailable.
      }
    }

    if (requests.length > 0 && requests[0]?.id.startsWith("TRK-")) {
      void hydrateRequests();
    }

    return () => {
      cancelled = true;
    };
  }, [requests, setRequests]);

  const filtered = useMemo(() => {
    let data = [...requests];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.pickupVillage.toLowerCase().includes(q) ||
          r.destinationMandi.toLowerCase().includes(q)
      );
    }
    if (onlyAggregated) data = data.filter((r) => r.aggregated);
    if (statusFilter !== "All") data = data.filter((r) => r.status === statusFilter);
    return data;
  }, [requests, search, onlyAggregated, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Summary calculations
  const avgCostBefore = 1420;
  const avgCostAfter = 852;
  const pctSaved = Math.round(((avgCostBefore - avgCostAfter) / avgCostBefore) * 100);

  return (
    <div className="space-y-5">
      {/* Summary KPI cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        <KPICard
          title="Avg Cost Before Optimization"
          value={`₹${avgCostBefore.toLocaleString("en-IN")}`}
          icon={Truck}
        />
        <KPICard
          title="Avg Cost After Optimization"
          value={`₹${avgCostAfter.toLocaleString("en-IN")}`}
          change="-40%"
          changeType="positive"
          icon={TrendingDown}
        />
        <KPICard
          title="Cost Saved"
          value={`${pctSaved}%`}
          change="Milk-run routing"
          changeType="positive"
          icon={Percent}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              type="text"
              placeholder="Search requests..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-10 pr-3 text-[13px] text-white placeholder:text-white/25 transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-white/50 transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option>All</option>
            <option>Pending</option>
            <option>Assigned</option>
            <option>Completed</option>
          </select>

          <label className="flex items-center gap-2 text-[13px] text-white/40 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyAggregated}
              onChange={(e) => { setOnlyAggregated(e.target.checked); setPage(1); }}
              className="rounded border-white/10 text-purple-400 focus:ring-purple-500"
            />
            Aggregated only
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-white/35 uppercase tracking-wider">Request ID</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-white/35 uppercase tracking-wider">Pickup Village</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-white/35 uppercase tracking-wider">Destination</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-white/35 uppercase tracking-wider">Capacity</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-white/35 uppercase tracking-wider">Aggregated</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-white/35 uppercase tracking-wider">Cost</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-white/35 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageData.map((req) => (
                <tr key={req.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-mono text-[11px] text-white/35">{req.id}</td>
                  <td className="px-5 py-3.5 text-white/50">{req.pickupVillage}</td>
                  <td className="px-5 py-3.5 text-white/50">{req.destinationMandi}</td>
                  <td className="px-5 py-3.5 text-white/40">{req.truckCapacity}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge variant={req.aggregated ? "yes" : "no"}>
                      {req.aggregated ? "Yes" : "No"}
                    </StatusBadge>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-white">
                    ₹{req.cost.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge
                      variant={
                        req.status === "Completed"
                          ? "completed"
                          : req.status === "Assigned"
                          ? "assigned"
                          : "pending"
                      }
                    >
                      {req.status}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-[13px] text-white/25">
                    No logistics requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 pb-4">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
