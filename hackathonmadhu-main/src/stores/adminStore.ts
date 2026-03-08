import { create } from "zustand";

// ─── Types ───────────────────────────────────────────

export interface MandiEntry {
  id: string;
  mandiName: string;
  state: string;
  crop: string;
  price: number;
  lastUpdated: string;
  status: "Active" | "Inactive";
}

export interface Farmer {
  id: string;
  name: string;
  district: string;
  state: string;
  primaryCrop: string;
  marketReach: number;
  lastActive: string;
  status: "Active" | "Inactive";
  totalSales: number;
  avgSellingPrice: number;
  transportHistory: { date: string; from: string; to: string; cost: number }[];
}

export interface LogisticsRequest {
  id: string;
  pickupVillage: string;
  destinationMandi: string;
  truckCapacity: string;
  aggregated: boolean;
  cost: number;
  status: "Pending" | "Assigned" | "Completed";
}

export interface APIService {
  name: string;
  status: "Active" | "Down" | "Degraded";
  latency: number;
  uptime: number;
  lastSync: string;
  errors: { timestamp: string; message: string; code: number }[];
}

// ─── Seed Data ───────────────────────────────────────

const STATES = [
  "Punjab", "Haryana", "Uttar Pradesh", "Maharashtra", "Madhya Pradesh",
  "Rajasthan", "Gujarat", "Karnataka", "Tamil Nadu", "Andhra Pradesh",
  "West Bengal", "Bihar", "Odisha", "Telangana", "Kerala",
];

const CROPS = [
  "Wheat", "Rice", "Tomato", "Onion", "Potato",
  "Cotton", "Soybean", "Mustard", "Maize", "Sugarcane",
  "Chilli", "Turmeric", "Groundnut", "Jowar", "Bajra",
];

const MANDIS = [
  "Azadpur Mandi", "Khanna Mandi", "Vashi Mandi", "Lasalgaon Mandi",
  "Indore Mandi", "Rajkot Mandi", "Guntur Mandi", "Kolar Mandi",
  "Karnal Mandi", "Agra Mandi", "Jaipur Mandi", "Davangere Mandi",
  "Bhopal Mandi", "Nashik Mandi", "Hubli Mandi", "Raipur Mandi",
  "Amritsar Mandi", "Ludhiana Mandi", "Nagpur Mandi", "Patna Mandi",
];

const DISTRICTS = [
  "Ludhiana", "Karnal", "Agra", "Nashik", "Indore", "Rajkot", "Guntur",
  "Kolar", "Davangere", "Jaipur", "Bhopal", "Hubli", "Raipur", "Amritsar",
  "Nagpur", "Patna", "Varanasi", "Coimbatore", "Warangal", "Ernakulam",
];

const FARMER_NAMES = [
  "Rajesh Kumar", "Suresh Patel", "Anita Devi", "Mohan Singh", "Lakshmi Bai",
  "Vikram Reddy", "Priya Sharma", "Deepak Yadav", "Sita Kumari", "Ramesh Gowda",
  "Kamala Devi", "Arvind Mishra", "Geeta Bai", "Harish Chandra", "Meena Kumari",
  "Baldev Singh", "Sunita Patel", "Gopal Krishna", "Kavita Devi", "Santosh Kumar",
  "Bhanu Pratap", "Durga Devi", "Kishan Lal", "Padma Bai", "Ravi Shankar",
];

const VILLAGES = [
  "Rampur", "Sultanpur", "Chandpur", "Bhimpur", "Devgarh",
  "Mandla", "Sitapur", "Gopalpur", "Nandigram", "Kotla",
  "Jhunjhunu", "Basavapatna", "Kanchipuram", "Warora", "Dhenkanal",
];

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d.toISOString().split("T")[0];
}

function randomId(): string {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

// ─── Mandi Seed ──────────────────────────────────────

const seedMandis: MandiEntry[] = Array.from({ length: 45 }, (_, i) => ({
  id: `MND-${String(i + 1).padStart(3, "0")}`,
  mandiName: MANDIS[i % MANDIS.length],
  state: STATES[i % STATES.length],
  crop: CROPS[i % CROPS.length],
  price: Math.floor(800 + Math.random() * 6500),
  lastUpdated: randomDate(15),
  status: Math.random() > 0.15 ? "Active" : "Inactive",
}));

// ─── Farmers Seed ────────────────────────────────────

const seedFarmers: Farmer[] = Array.from({ length: 30 }, (_, i) => ({
  id: `FRM-${String(i + 1).padStart(4, "0")}`,
  name: FARMER_NAMES[i % FARMER_NAMES.length],
  district: DISTRICTS[i % DISTRICTS.length],
  state: STATES[i % STATES.length],
  primaryCrop: CROPS[i % CROPS.length],
  marketReach: Math.floor(15 + Math.random() * 60),
  lastActive: randomDate(30),
  status: Math.random() > 0.1 ? "Active" : "Inactive",
  totalSales: Math.floor(50000 + Math.random() * 500000),
  avgSellingPrice: Math.floor(1200 + Math.random() * 5000),
  transportHistory: Array.from({ length: 3 + Math.floor(Math.random() * 5) }, () => ({
    date: randomDate(90),
    from: VILLAGES[Math.floor(Math.random() * VILLAGES.length)],
    to: MANDIS[Math.floor(Math.random() * MANDIS.length)],
    cost: Math.floor(200 + Math.random() * 1200),
  })),
}));

// ─── Logistics Seed ──────────────────────────────────

const STATUSES: LogisticsRequest["status"][] = ["Pending", "Assigned", "Completed"];

const seedLogistics: LogisticsRequest[] = Array.from({ length: 35 }, (_, i) => ({
  id: `TRK-${String(i + 1).padStart(4, "0")}`,
  pickupVillage: VILLAGES[i % VILLAGES.length],
  destinationMandi: MANDIS[i % MANDIS.length],
  truckCapacity: `${[2, 3, 5, 7][Math.floor(Math.random() * 4)]}T`,
  aggregated: Math.random() > 0.4,
  cost: Math.floor(400 + Math.random() * 2000),
  status: STATUSES[i % 3],
}));

// ─── API Services Seed ───────────────────────────────

const seedAPIs: APIService[] = [
  {
    name: "Bhashini API",
    status: "Active",
    latency: 142,
    uptime: 99.7,
    lastSync: "2026-03-03T14:22:00Z",
    errors: [
      { timestamp: "2026-03-02T08:12:00Z", message: "Timeout on Hindi TTS model", code: 504 },
      { timestamp: "2026-03-01T03:45:00Z", message: "Rate limit exceeded", code: 429 },
    ],
  },
  {
    name: "Agmarknet API",
    status: "Active",
    latency: 230,
    uptime: 98.2,
    lastSync: "2026-03-03T14:18:00Z",
    errors: [
      { timestamp: "2026-03-03T06:30:00Z", message: "503 upstream unavailable (scheduled maintenance)", code: 503 },
      { timestamp: "2026-02-28T22:10:00Z", message: "Stale data detected for Maharashtra mandis", code: 200 },
      { timestamp: "2026-02-27T11:00:00Z", message: "Connection reset by peer", code: 502 },
    ],
  },
  {
    name: "ONDC API",
    status: "Degraded",
    latency: 580,
    uptime: 95.4,
    lastSync: "2026-03-03T13:55:00Z",
    errors: [
      { timestamp: "2026-03-03T12:00:00Z", message: "High latency on catalog search endpoint", code: 200 },
      { timestamp: "2026-03-02T19:30:00Z", message: "Auth token refresh failed", code: 401 },
    ],
  },
];

// ─── Chart Data ──────────────────────────────────────

export const priceTrendData = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    price: Math.floor(2100 + Math.sin(i / 4) * 300 + Math.random() * 200),
  };
});

export const logisticsRegionData = [
  { region: "Punjab", requests: 142 },
  { region: "Haryana", requests: 98 },
  { region: "UP", requests: 186 },
  { region: "Maharashtra", requests: 134 },
  { region: "MP", requests: 87 },
  { region: "Rajasthan", requests: 76 },
  { region: "Gujarat", requests: 112 },
  { region: "Karnataka", requests: 95 },
];

export const cropDistributionData = [
  { name: "Cereals", value: 35 },
  { name: "Vegetables", value: 25 },
  { name: "Oilseeds", value: 18 },
  { name: "Cash Crops", value: 12 },
  { name: "Pulses", value: 10 },
];

export const priceVolatilityData = CROPS.slice(0, 8).map((crop) => ({
  crop,
  ...Object.fromEntries(
    STATES.slice(0, 6).map((state) => [
      state,
      Math.floor(5 + Math.random() * 35),
    ])
  ),
}));

export const monthlyIncomeData = [
  { month: "Oct", before: 18000, after: 23400 },
  { month: "Nov", before: 21000, after: 27300 },
  { month: "Dec", before: 16000, after: 20800 },
  { month: "Jan", before: 22000, after: 28600 },
  { month: "Feb", before: 19500, after: 25350 },
  { month: "Mar", before: 24000, after: 31200 },
];

export const logisticsCostData = [
  { month: "Oct", beforeOpt: 1400, afterOpt: 840 },
  { month: "Nov", beforeOpt: 1550, afterOpt: 930 },
  { month: "Dec", beforeOpt: 1200, afterOpt: 720 },
  { month: "Jan", beforeOpt: 1600, afterOpt: 960 },
  { month: "Feb", beforeOpt: 1350, afterOpt: 810 },
  { month: "Mar", beforeOpt: 1700, afterOpt: 1020 },
];

// ─── Stores ──────────────────────────────────────────

interface MandiStore {
  entries: MandiEntry[];
  setEntries: (entries: MandiEntry[]) => void;
  addEntry: (entry: Omit<MandiEntry, "id">) => void;
  updateEntry: (id: string, data: Partial<MandiEntry>) => void;
  deleteEntry: (id: string) => void;
}

export const useMandiStore = create<MandiStore>((set) => ({
  entries: seedMandis,
  setEntries: (entries) => set({ entries }),
  addEntry: (entry) =>
    set((s) => ({
      entries: [{ ...entry, id: `MND-${randomId()}` }, ...s.entries],
    })),
  updateEntry: (id, data) =>
    set((s) => ({
      entries: s.entries.map((e) => (e.id === id ? { ...e, ...data } : e)),
    })),
  deleteEntry: (id) =>
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
}));

interface FarmerStore {
  farmers: Farmer[];
  setFarmers: (farmers: Farmer[]) => void;
}

export const useFarmerStore = create<FarmerStore>((set) => ({
  farmers: seedFarmers,
  setFarmers: (farmers) => set({ farmers }),
}));

interface LogisticsStore {
  requests: LogisticsRequest[];
  setRequests: (requests: LogisticsRequest[]) => void;
}

export const useLogisticsStore = create<LogisticsStore>((set) => ({
  requests: seedLogistics,
  setRequests: (requests) => set({ requests }),
}));

interface APIStore {
  services: APIService[];
  setServices: (services: APIService[]) => void;
}

export const useAPIStore = create<APIStore>((set) => ({
  services: seedAPIs,
  setServices: (services) => set({ services }),
}));
