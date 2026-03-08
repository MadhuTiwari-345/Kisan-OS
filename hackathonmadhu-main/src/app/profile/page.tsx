"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Globe,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Mountain,
  Phone,
  Plus,
  Save,
  Sprout,
  Tractor,
  Wallet,
} from "lucide-react";

import { authApi, farmsApi, type FarmRecord } from "@/lib/api";
import { FARMER_LANGUAGES } from "@/lib/languages";
import { useAuthStore, type User } from "@/stores/authStore";

export default function ProfilePage() {
  const { logout, setUser } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingFarm, setCreatingFarm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    language: "hi-IN",
    village: "",
    district: "",
    state: "",
    upi_id: "",
    total_farm_size_hectares: "0",
    primary_crops: "",
  });
  const [farmForm, setFarmForm] = useState({
    name: "Main Farm Block",
    size_hectares: 1.5,
    soil_type: "loamy",
    soil_ph: 6.8,
    water_availability: "medium",
    irrigation_type: "drip",
  });

  useEffect(() => {
    async function hydrate() {
      try {
        setLoading(true);
        const [profileResult, farmResult] = await Promise.all([authApi.getProfile(), farmsApi.list()]);
        setProfile(profileResult);
        setFarms(farmResult.items);
        setForm({
          name: profileResult.name || "",
          email: profileResult.email || "",
          language: profileResult.language || "hi-IN",
          village: profileResult.village || "",
          district: profileResult.district || "",
          state: profileResult.state || "",
          upi_id: profileResult.upi_id || "",
          total_farm_size_hectares: String(profileResult.total_farm_size_hectares || 0),
          primary_crops: (profileResult.primary_crops || []).join(", "),
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    void hydrate();
  }, []);

  async function handleSaveProfile() {
    try {
      setSaving(true);
      const updated = await authApi.updateProfile({
        name: form.name,
        email: form.email || undefined,
        language: form.language,
        village: form.village || undefined,
        district: form.district || undefined,
        state: form.state || undefined,
        upi_id: form.upi_id || undefined,
        total_farm_size_hectares: Number(form.total_farm_size_hectares || 0),
        primary_crops: form.primary_crops
          .split(",")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean),
      });
      setProfile(updated);
      setUser(updated);
      setMessage("Profile saved successfully.");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateFarm() {
    try {
      setCreatingFarm(true);
      await farmsApi.create(farmForm);
      const updatedFarms = await farmsApi.list();
      setFarms(updatedFarms.items);
      setMessage("Farm added successfully.");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add farm.");
    } finally {
      setCreatingFarm(false);
    }
  }

  return (
    <div className="app-screen min-h-screen pb-20 text-white">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <section className="app-panel rounded-[2rem] p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="app-kicker">Profile and farm settings</span>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Identity, payments, and farm records</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/62">
                Update your multilingual profile, UPI details, crop preferences, and farm inventory
                used across advisory, marketplace, and logistics flows.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard" className="app-button-secondary rounded-2xl px-4 py-3 text-sm font-semibold">
                Back to dashboard
              </Link>
              <button
                type="button"
                onClick={() => void handleSaveProfile()}
                disabled={saving}
                className="app-button-primary flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save profile
              </button>
            </div>
          </div>
        </section>

        {(error || message) && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              error
                ? "border border-red-400/20 bg-red-500/10 text-red-200"
                : "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {error || message}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-white/46">
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            Loading profile...
          </div>
        ) : (
          <>
            <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="app-panel-soft rounded-[2rem] p-6">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <Sprout className="h-7 w-7 text-[#dff8bc]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{profile?.name}</h2>
                    <p className="text-sm capitalize text-white/48">{profile?.role}</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="rounded-2xl border border-white/8 bg-black/18 p-4">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-[#dff8bc]" />
                      <span className="text-white/62">Phone</span>
                    </div>
                    <p className="mt-2 font-semibold text-white">{profile?.phone}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/18 p-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-[#dff8bc]" />
                      <span className="text-white/62">Email</span>
                    </div>
                    <p className="mt-2 font-semibold text-white">{profile?.email || "Not set"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/18 p-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-[#dff8bc]" />
                      <span className="text-white/62">Location</span>
                    </div>
                    <p className="mt-2 font-semibold text-white">
                      {[profile?.village, profile?.district, profile?.state].filter(Boolean).join(", ") ||
                        profile?.location ||
                        "Not set"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="app-panel-soft rounded-[2rem] p-6">
                <h2 className="mb-5 text-xl font-black text-white">Editable profile</h2>
                <div className="grid gap-4">
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="app-input"
                    placeholder="Name"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      className="app-input"
                      placeholder="Email"
                    />
                    <select
                      value={form.language}
                      onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}
                      className="app-select"
                      title="Select your preferred language"
                    >
                      {FARMER_LANGUAGES.map((item) => (
                        <option key={item.code} value={item.code} className="bg-[#102019]">
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      value={form.village}
                      onChange={(event) => setForm((current) => ({ ...current, village: event.target.value }))}
                      className="app-input"
                      placeholder="Village"
                    />
                    <input
                      value={form.district}
                      onChange={(event) => setForm((current) => ({ ...current, district: event.target.value }))}
                      className="app-input"
                      placeholder="District"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      value={form.state}
                      onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
                      className="app-input"
                      placeholder="State"
                    />
                    <input
                      value={form.upi_id}
                      onChange={(event) => setForm((current) => ({ ...current, upi_id: event.target.value }))}
                      className="app-input"
                      placeholder="UPI ID"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      type="number"
                      value={form.total_farm_size_hectares}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, total_farm_size_hectares: event.target.value }))
                      }
                      className="app-input"
                      placeholder="Farm size (hectares)"
                    />
                    <input
                      value={form.primary_crops}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, primary_crops: event.target.value }))
                      }
                      className="app-input"
                      placeholder="Primary crops"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="app-panel-soft rounded-[2rem] p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <Plus className="h-5 w-5 text-[#dff8bc]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Add farm details</h2>
                    <p className="text-sm text-white/46">Persist land blocks for better AI and logistics context.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    value={farmForm.name}
                    onChange={(event) => setFarmForm((current) => ({ ...current, name: event.target.value }))}
                    className="app-input"
                    placeholder="Farm block name"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="number"
                      value={farmForm.size_hectares}
                      onChange={(event) =>
                        setFarmForm((current) => ({ ...current, size_hectares: Number(event.target.value) }))
                      }
                      className="app-input"
                      placeholder="Size in hectares"
                    />
                    <input
                      value={farmForm.soil_type}
                      onChange={(event) => setFarmForm((current) => ({ ...current, soil_type: event.target.value }))}
                      className="app-input"
                      placeholder="Soil type"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="number"
                      value={farmForm.soil_ph}
                      onChange={(event) =>
                        setFarmForm((current) => ({ ...current, soil_ph: Number(event.target.value) }))
                      }
                      className="app-input"
                      placeholder="Soil pH"
                    />
                    <input
                      value={farmForm.water_availability}
                      onChange={(event) =>
                        setFarmForm((current) => ({ ...current, water_availability: event.target.value }))
                      }
                      className="app-input"
                      placeholder="Water availability"
                    />
                  </div>
                  <input
                    value={farmForm.irrigation_type}
                    onChange={(event) =>
                      setFarmForm((current) => ({ ...current, irrigation_type: event.target.value }))
                    }
                    className="app-input"
                    placeholder="Irrigation type"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCreateFarm()}
                    disabled={creatingFarm}
                    className="app-button-primary flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold"
                  >
                    {creatingFarm ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add farm
                  </button>
                </div>
              </div>

              <div className="app-panel-soft rounded-[2rem] p-6">
                <h2 className="mb-5 text-xl font-black text-white">Registered farms</h2>
                <div className="space-y-3">
                  {farms.map((farm) => (
                    <div key={farm.id} className="rounded-[1.5rem] border border-white/8 bg-black/18 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-white">{farm.name}</p>
                          <p className="mt-1 text-xs text-white/46">
                            {farm.soil_type} • {farm.water_availability || "water n/a"}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#dff8bc]">
                          {farm.size_hectares} ha
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                          <div className="flex items-center gap-2 text-white/48">
                            <Mountain className="h-4 w-4 text-[#dff8bc]" />
                            pH
                          </div>
                          <p className="mt-2 font-bold text-white">{farm.soil_ph ?? "N/A"}</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                          <div className="flex items-center gap-2 text-white/48">
                            <Tractor className="h-4 w-4 text-[#dff8bc]" />
                            Irrigation
                          </div>
                          <p className="mt-2 font-bold text-white">{farm.irrigation_type || "N/A"}</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                          <div className="flex items-center gap-2 text-white/48">
                            <Building2 className="h-4 w-4 text-[#dff8bc]" />
                            Added
                          </div>
                          <p className="mt-2 font-bold text-white">
                            {new Date(farm.created_at).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {farms.length === 0 && (
                    <p className="text-sm text-white/46">No farms added yet. Create your first farm block.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-4">
              <div className="app-stat rounded-2xl p-5">
                <div className="flex items-center gap-2 text-white/48">
                  <Globe className="h-4 w-4 text-[#dff8bc]" />
                  Language
                </div>
                <p className="mt-3 text-xl font-black text-white">{profile?.language}</p>
              </div>
              <div className="app-stat rounded-2xl p-5">
                <div className="flex items-center gap-2 text-white/48">
                  <Wallet className="h-4 w-4 text-[#dff8bc]" />
                  UPI
                </div>
                <p className="mt-3 text-xl font-black text-white">{profile?.upi_id || "Not set"}</p>
              </div>
              <div className="app-stat rounded-2xl p-5">
                <div className="flex items-center gap-2 text-white/48">
                  <Mountain className="h-4 w-4 text-[#dff8bc]" />
                  Farm size
                </div>
                <p className="mt-3 text-xl font-black text-white">{profile?.total_farm_size_hectares || 0} ha</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  window.location.href = "/login";
                }}
                className="app-button-secondary flex items-center justify-center gap-2 rounded-2xl px-4 py-5 text-sm font-semibold"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
