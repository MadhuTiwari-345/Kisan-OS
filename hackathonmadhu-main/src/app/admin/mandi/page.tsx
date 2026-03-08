"use client";

import { useEffect, useMemo, useState } from "react";
import { useMandiStore, type MandiEntry } from "@/stores/adminStore";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Modal } from "@/components/admin/Modal";
import { Pagination } from "@/components/admin/Pagination";
import { Search, Plus, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { marketApi, type MarketPriceResponse } from "@/lib/api";

const STATES = [
  "All States", "Punjab", "Haryana", "Uttar Pradesh", "Maharashtra",
  "Madhya Pradesh", "Rajasthan", "Gujarat", "Karnataka", "Tamil Nadu",
  "Andhra Pradesh", "West Bengal", "Bihar", "Odisha", "Telangana", "Kerala",
];

const CROPS = [
  "All Crops", "Wheat", "Rice", "Tomato", "Onion", "Potato",
  "Cotton", "Soybean", "Mustard", "Maize", "Sugarcane",
  "Chilli", "Turmeric", "Groundnut", "Jowar", "Bajra",
];

const PER_PAGE = 10;

const emptyForm: Omit<MandiEntry, "id"> = {
  mandiName: "",
  state: "Punjab",
  crop: "Wheat",
  price: 0,
  lastUpdated: new Date().toISOString().split("T")[0],
  status: "Active",
};

export default function MandiPage() {
  const { entries, setEntries, addEntry, updateEntry, deleteEntry } = useMandiStore();

  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("All States");
  const [cropFilter, setCropFilter] = useState("All Crops");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let cancelled = false;

    async function loadLiveFeed() {
      try {
        const result: MarketPriceResponse = await marketApi.getPrices("wheat");
        const liveEntries = (result.prices || []).map((item, index: number) => ({
          id: `MND-LIVE-${index}`,
          mandiName: item.mandi || "Unknown Mandi",
          state: item.state || "Unknown",
          crop: item.crop_name || "Wheat",
          price: Number(item.price || item.price_per_kg * 100 || 0),
          lastUpdated: new Date().toISOString().slice(0, 10),
          status: "Active" as const,
        }));

        if (!cancelled && liveEntries.length > 0) {
          setEntries(liveEntries);
        }
      } catch {
        // Keep seeded admin data when backend is unavailable.
      }
    }

    if (entries.length > 0 && !entries[0]?.id.startsWith("MND-LIVE-")) {
      void loadLiveFeed();
    }

    return () => {
      cancelled = true;
    };
  }, [entries, setEntries]);

  // Filter + sort
  const filtered = useMemo(() => {
    let data = [...entries];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (e) =>
          e.mandiName.toLowerCase().includes(q) ||
          e.crop.toLowerCase().includes(q) ||
          e.state.toLowerCase().includes(q)
      );
    }
    if (stateFilter !== "All States") data = data.filter((e) => e.state === stateFilter);
    if (cropFilter !== "All Crops") data = data.filter((e) => e.crop === cropFilter);
    data.sort((a, b) => (sortDir === "asc" ? a.price - b.price : b.price - a.price));
    return data;
  }, [entries, search, stateFilter, cropFilter, sortDir]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (entry: MandiEntry) => {
    setEditingId(entry.id);
    setForm({
      mandiName: entry.mandiName,
      state: entry.state,
      crop: entry.crop,
      price: entry.price,
      lastUpdated: entry.lastUpdated,
      status: entry.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.mandiName || !form.price) return;
    if (editingId) {
      updateEntry(editingId, form);
    } else {
      addEntry(form);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              type="text"
              placeholder="Search mandis..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-10 pr-3 text-[13px] text-white placeholder:text-white/25 transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Filters */}
          <select
            value={stateFilter}
            onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-white/50 transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <select
            value={cropFilter}
            onChange={(e) => { setCropFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-white/50 transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            {CROPS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-purple-900/20 transition-all hover:from-purple-500 hover:to-fuchsia-400 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Mandi Data
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-white/35 uppercase tracking-wider">
                  Mandi Name
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-white/35 uppercase tracking-wider">
                  State
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-white/35 uppercase tracking-wider">
                  Crop
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-white/35 uppercase tracking-wider">
                  <button
                    onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                    className="inline-flex items-center gap-1 cursor-pointer"
                  >
                    Price (₹/q)
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-white/35 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-white/35 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-white/35 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageData.map((entry) => (
                <tr key={entry.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-semibold text-white">
                    {entry.mandiName}
                  </td>
                  <td className="px-5 py-3.5 text-white/40">{entry.state}</td>
                  <td className="px-5 py-3.5 text-white/40">{entry.crop}</td>
                  <td className="px-5 py-3.5 font-bold text-white">
                    ₹{entry.price.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3.5 text-white/35">{entry.lastUpdated}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge variant={entry.status === "Active" ? "active" : "inactive"}>
                      {entry.status}
                    </StatusBadge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(entry)}
                        className="rounded-lg p-2 text-white/25 transition-colors hover:bg-white/5 hover:text-white/50 cursor-pointer"
                        aria-label={`Edit ${entry.mandiName}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="rounded-lg p-2 text-white/25 transition-colors hover:bg-red-50 hover:text-red-500 cursor-pointer"
                        aria-label={`Delete ${entry.mandiName}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-[13px] text-white/25">
                    No mandi data found.
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

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Mandi Data" : "Add Mandi Data"}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-white/35">
              Mandi Name
            </label>
            <input
              type="text"
              value={form.mandiName}
              onChange={(e) => setForm({ ...form, mandiName: e.target.value })}
              placeholder="e.g. Azadpur Mandi"
              className="w-full rounded-xl border border-white/[0.06] px-4 py-2.5 text-[13px] text-white transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-white/35">
                State
              </label>
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full rounded-xl border border-white/[0.06] px-4 py-2.5 text-[13px] text-white/50 transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                {STATES.filter((s) => s !== "All States").map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-white/35">
                Crop
              </label>
              <select
                value={form.crop}
                onChange={(e) => setForm({ ...form, crop: e.target.value })}
                className="w-full rounded-xl border border-white/[0.06] px-4 py-2.5 text-[13px] text-white/50 transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                {CROPS.filter((c) => c !== "All Crops").map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-white/35">
                Price (₹/quintal)
              </label>
              <input
                type="number"
                value={form.price || ""}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                placeholder="2400"
                className="w-full rounded-xl border border-white/[0.06] px-4 py-2.5 text-[13px] text-white transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-white/35">
                Date
              </label>
              <input
                type="date"
                value={form.lastUpdated}
                onChange={(e) => setForm({ ...form, lastUpdated: e.target.value })}
                className="w-full rounded-xl border border-white/[0.06] px-4 py-2.5 text-[13px] text-white transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-white/35">
              Status
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, status: "Active" })}
                className={`rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-all cursor-pointer ${
                  form.status === "Active"
                    ? "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/30"
                    : "bg-white/[0.04] text-white/35 hover:bg-white/5"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, status: "Inactive" })}
                className={`rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-all cursor-pointer ${
                  form.status === "Inactive"
                    ? "bg-white/[0.06] text-white/60 ring-1 ring-white/10"
                    : "bg-white/[0.04] text-white/35 hover:bg-white/5"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-xl px-5 py-2.5 text-[13px] font-medium text-white/40 hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-2.5 text-[13px] font-semibold text-white hover:from-purple-500 hover:to-fuchsia-400 transition-all cursor-pointer"
            >
              {editingId ? "Update" : "Add Entry"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
