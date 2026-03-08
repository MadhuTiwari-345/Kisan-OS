"use client";

import { useState } from "react";
import { User, Shield, Key, Bell } from "lucide-react";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "Admin User",
    email: "admin@kisan-os.in",
    role: "Super Admin",
  });

  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    logisticsUpdates: true,
    systemAlerts: true,
    weeklyReport: false,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Profile */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 shadow-sm">
            <User className="h-4.5 w-4.5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold tracking-tight text-white">Admin Profile</h3>
            <p className="text-[12px] text-white/35">Manage your account details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-white/35">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full rounded-xl border border-white/[0.06] px-4 py-2.5 text-[13px] text-white transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-white/35">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full rounded-xl border border-white/[0.06] px-4 py-2.5 text-[13px] text-white transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>
      </div>

      {/* Role Management */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 shadow-sm">
            <Shield className="h-4.5 w-4.5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold tracking-tight text-white">Role Management</h3>
            <p className="text-[12px] text-white/35">Manage team access and permissions</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-white/[0.03]">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-white/35 uppercase tracking-wider">User</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-white/35 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-white/35 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-white/35 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { name: "Admin User", email: "admin@kisan-os.in", role: "Super Admin", active: true },
                { name: "Priya Sharma", email: "priya@kisan-os.in", role: "Data Manager", active: true },
                { name: "Rajesh Kumar", email: "rajesh@kisan-os.in", role: "Logistics Lead", active: true },
                { name: "Anita Desai", email: "anita@kisan-os.in", role: "Viewer", active: false },
              ].map((user) => (
                <tr key={user.email} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-semibold text-white">{user.name}</td>
                  <td className="px-5 py-3 text-white/40">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-semibold text-white/50 border border-white/[0.06]">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        user.active
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : "bg-white/[0.04] text-white/35 border border-white/[0.06]"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${user.active ? "bg-purple-500" : "bg-white/25"}`} />
                      {user.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Keys */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 shadow-sm">
            <Key className="h-4.5 w-4.5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold tracking-tight text-white">API Keys</h3>
            <p className="text-[12px] text-white/35">Manage external API credentials</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { name: "Bhashini API Key", value: "bh_sk_••••••••••••3f7a" },
            { name: "Agmarknet Access Token", value: "agm_••••••••••••8e2b" },
            { name: "ONDC Subscriber ID", value: "ondc_sub_••••••••k9m4" },
          ].map((key) => (
            <div key={key.name} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-5 py-4 border border-white/[0.04]">
              <div>
                <p className="text-[13px] font-semibold text-white/60">{key.name}</p>
                <p className="mt-0.5 font-mono text-[11px] text-white/35">{key.value}</p>
              </div>
              <button className="rounded-xl px-4 py-2 text-[12px] font-semibold text-purple-400 transition-colors hover:bg-purple-500/10 cursor-pointer">
                Rotate
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 shadow-sm">
            <Bell className="h-4.5 w-4.5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold tracking-tight text-white">Notification Preferences</h3>
            <p className="text-[12px] text-white/35">Choose what alerts you receive</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: "priceAlerts" as const, label: "Price Alerts", desc: "Get notified on significant price changes" },
            { key: "logisticsUpdates" as const, label: "Logistics Updates", desc: "Transport request status changes" },
            { key: "systemAlerts" as const, label: "System Alerts", desc: "API downtime and error notifications" },
            { key: "weeklyReport" as const, label: "Weekly Report", desc: "Summary email every Monday" },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-xl bg-white/[0.03] px-5 py-4 border border-white/[0.04]"
            >
              <div>
                <p className="text-[13px] font-semibold text-white/60">{item.label}</p>
                <p className="text-[11px] text-white/35">{item.desc}</p>
              </div>
              <button
                onClick={() =>
                  setNotifications({
                    ...notifications,
                    [item.key]: !notifications[item.key],
                  })
                }
                className={`relative h-6 w-11 rounded-full transition-all cursor-pointer ${
                  notifications[item.key] ? "bg-purple-500" : "bg-white/[0.06]"
                }`}
                role="switch"
                aria-checked={notifications[item.key]}
                aria-label={item.label}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    notifications[item.key] ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3 pb-8">
        {saved && (
          <span className="text-[13px] font-semibold text-purple-400">
            ✓ Settings saved
          </span>
        )}
        <button
          onClick={handleSave}
          className="rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-8 py-3 text-[13px] font-semibold text-white shadow-purple-900/20 transition-all hover:from-purple-500 hover:to-fuchsia-400 cursor-pointer"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
