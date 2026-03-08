const API_BASE_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
  id: number;
  phone: string;
  name: string;
  email?: string | null;
  language: string;
  role: "farmer" | "buyer" | "logistics" | "admin";
  latitude?: number;
  longitude?: number;
  location?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  upi_id?: string | null;
  total_farm_size_hectares?: number;
  primary_crops?: string[];
  created_at?: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}

export interface FarmerRecord {
  id: number;
  name: string;
  phone: string;
  language: string;
  location?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  farm_size?: number;
  primary_crops?: string[];
  created_at: string;
  role: string;
}

export interface FarmRecord {
  id: number;
  farmer_id: number;
  name: string;
  size_hectares: number;
  soil_type: string;
  soil_ph?: number | null;
  water_availability?: string | null;
  irrigation_type?: string | null;
  boundary_geojson?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface FarmCrop {
  id: number;
  farm_id: number;
  crop_name: string;
  variety?: string | null;
  season: string;
  area_hectares: number;
  expected_yield_quintals?: number | null;
  plantation_date?: string | null;
  expected_harvest_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: number;
  farmer_id: number;
  crop_name: string;
  category?: string | null;
  season?: string | null;
  quantity_kg: number;
  price_per_kg: number;
  total_value: number;
  mandi_name: string;
  location?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BidRecord {
  id: number;
  listing_id: number;
  bidder_user_id: number;
  buyer_id?: number | null;
  quantity_kg: number;
  bid_price_per_kg: number;
  total_amount: number;
  note?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OrderRecord {
  id: number;
  buyer_id?: number | null;
  buyer_name: string;
  listing_id: number;
  farmer_id: number;
  quantity_kg: number;
  price_per_kg: number;
  total_amount: number;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: number;
  order_id: number;
  payer_user_id?: number | null;
  payee_farmer_id: number;
  amount: number;
  payment_method: string;
  transaction_reference: string;
  status: string;
  transparency_payload: Record<string, unknown>;
  created_at: string;
}

export interface OrderDetailResponse {
  order: OrderRecord;
  transactions: PaymentTransaction[];
}

export interface MarketPrice {
  crop_name: string;
  crop: string;
  mandi: string;
  state?: string;
  price: number;
  price_per_kg: number;
  arrival?: number;
  arrival_tons?: number;
  trend?: string;
  price_date: string;
  data_freshness?: string;
}

export interface MarketPriceResponse {
  request_id: string;
  language: string;
  data_freshness: string;
  source_system: string;
  is_offline_fallback: boolean;
  crop: string;
  average_price: number;
  trend: string;
  prices: MarketPrice[];
}

export interface PriceComparison {
  request_id?: string;
  language?: string;
  data_freshness?: string;
  source_system?: string;
  is_offline_fallback?: boolean;
  crop: string;
  markets: MarketPrice[];
  best_mandi: string;
  best_price: number;
  price_trend: string;
  recommendation: string;
}

export interface BestMandiResponse {
  crop: string;
  best_mandi: string;
  best_price: number;
  best_state?: string | null;
  alternatives: Array<{
    mandi: string;
    price_per_kg: number;
    state?: string | null;
  }>;
  recommendation: string;
}

export interface AdvisoryResponse {
  request_id?: string;
  query: string;
  response: string;
  language: string;
  crop?: string | null;
  sources: string[];
  confidence: number;
  data_freshness?: string;
  source_system?: string;
  is_offline_fallback?: boolean;
}

export interface AdvisoryHistoryItem {
  query: string;
  response: string;
  crop?: string | null;
  sources: string[];
  confidence: number;
  created_at: string;
}

export interface AdvisoryHistoryResponse {
  request_id: string;
  language: string;
  data_freshness: string;
  source_system: string;
  is_offline_fallback: boolean;
  items: AdvisoryHistoryItem[];
}

export interface CropRecommendation {
  crop: string;
  expected_yield_quintals: number;
  estimated_profit: number;
  water_requirement_mm: number;
  season_suitability: string;
  market_demand: string;
}

export interface DiseaseDetection {
  request_id?: string;
  crop: string;
  disease_name: string;
  confidence: number;
  severity: string;
  treatment: string[];
  prevention: string[];
  urgency: string;
}

export interface TransportRequest {
  id: number;
  crop_type: string;
  quantity_kg: number;
  pickup_location: string;
  destination_mandi: string;
  status: string;
  price_estimate?: number;
  final_price?: number;
  truck_type: string;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  vehicle_number?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LogisticsHistoryResponse {
  requests: TransportRequest[];
  total: number;
}

export interface MilkRunRouteStop {
  stop: number;
  type: string;
  farmerName: string;
  latitude: number;
  longitude: number;
  distanceFromPrevKm: number;
}

export interface MilkRunRoute {
  pool_id: number;
  crop_type: string;
  destination_mandi: string;
  total_quantity_kg: number;
  total_farmers: number;
  optimizedRoute: MilkRunRouteStop[];
  totalDistanceKm: number;
  totalCostRupees: number;
  total_distance_km: number;
  total_cost_rupees: number;
  cost_per_kg: number;
  estimated_delivery_hours: number;
  carbon_saved_kg: number;
  savingsPercentage: number;
}

export interface PricePredictionResponse {
  request_id: string;
  language: string;
  generated_at: string;
  crop: string;
  state?: string | null;
  recommended_price_per_kg: number;
  predicted_price_per_kg: number;
  current_average_price_per_kg?: number;
  trend: string;
  confidence: number;
  basis: string;
  observations?: number;
}

export interface DemandForecastItem {
  crop: string;
  historical_demand_kg: number;
  active_supply_kg: number;
  projected_demand_kg: number;
  demand_supply_ratio: number;
  demand_signal: string;
  best_action: string;
  planting_signal: string;
}

export interface DemandForecastResponse {
  request_id: string;
  language: string;
  generated_at: string;
  lookahead_days: number;
  items: DemandForecastItem[];
}

export interface DashboardAnalytics {
  users: {
    farmers: number;
    buyers: number;
    total_accounts: number;
  };
  marketplace: {
    active_listings: number;
    open_bids: number;
    orders_count: number;
    gross_merchandise_value: number;
  };
  transactions: {
    paid_revenue: number;
    pending_revenue: number;
    successful_transactions: number;
  };
  logistics: {
    transport_requests: number;
    pooled_shipments: number;
    pooled_quantity_kg: number;
  };
  market_intelligence: {
    top_price_per_kg: Record<string, number>;
    demand_forecast: DemandForecastItem[];
  };
}

export interface VoiceQueryResponse {
  query_text: string;
  response_text: string;
  response_audio_base64?: string;
  language: string;
  confidence?: number;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("access_token");
}

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `API error: ${response.status}` }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const authApi = {
  register: async (payload: {
    phone: string;
    name: string;
    password: string;
    email?: string;
    language?: string;
    role?: "farmer" | "buyer" | "logistics";
    location?: string;
    company_name?: string;
  }): Promise<AuthToken> => {
    const result = await apiCall<AuthToken>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", result.access_token);
    }
    return result;
  },

  login: async (identifier: string, password: string): Promise<AuthToken> => {
    const formData = new URLSearchParams();
    formData.append("username", identifier);
    formData.append("password", password);

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Invalid credentials" }));
      throw new Error(error.detail || "Invalid credentials");
    }

    const result = (await response.json()) as AuthToken;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", result.access_token);
    }
    return result;
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }
  },

  getProfile: async (): Promise<User> => apiCall<User>("/api/auth/profile"),

  updateProfile: async (updates: Partial<User>): Promise<User> =>
    apiCall<User>("/api/auth/me", {
      method: "PUT",
      body: JSON.stringify(updates),
    }),
};

export const farmersApi = {
  list: async () => apiCall<{ items: FarmerRecord[]; total: number }>("/api/farmers"),
  create: async (payload: {
    name: string;
    phone: string;
    password: string;
    language?: string;
    village?: string;
    district?: string;
    state?: string;
    location?: string;
    total_farm_size_hectares?: number;
    primary_crops?: string[];
  }) =>
    apiCall<FarmerRecord>("/api/farmers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const farmsApi = {
  list: async (farmerId?: number) =>
    apiCall<{ items: FarmRecord[]; total: number }>(
      farmerId ? `/api/farms?farmer_id=${farmerId}` : "/api/farms"
    ),
  create: async (payload: {
    name: string;
    size_hectares: number;
    soil_type: string;
    soil_ph?: number;
    water_availability?: string;
    irrigation_type?: string;
    boundary_geojson?: Record<string, unknown>;
  }) =>
    apiCall<FarmRecord>("/api/farms", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  get: async (farmId: number) =>
    apiCall<{ farm: FarmRecord; crops: FarmCrop[] }>(`/api/farms/${farmId}`),
  listCrops: async (farmId: number) =>
    apiCall<{ items: FarmCrop[]; total: number }>(`/api/farms/${farmId}/crops`),
  createCrop: async (
    farmId: number,
    payload: {
      crop_name: string;
      variety?: string;
      season: string;
      area_hectares: number;
      expected_yield_quintals?: number;
      plantation_date?: string;
      expected_harvest_date?: string;
    }
  ) =>
    apiCall<FarmCrop>(`/api/farms/${farmId}/crops`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const listingsApi = {
  list: async (crop?: string, status?: string) => {
    const params = new URLSearchParams();
    if (crop) params.set("crop", crop);
    if (status) params.set("status", status);
    return apiCall<{ items: Listing[]; total: number }>(
      `/api/listings${params.toString() ? `?${params.toString()}` : ""}`
    );
  },
  create: async (payload: {
    crop_name: string;
    category?: string;
    season?: string;
    quantity_kg: number;
    price_per_kg: number;
    mandi_name: string;
    location?: string;
  }) =>
    apiCall<Listing>("/api/listings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: async (
    listingId: number,
    payload: Partial<{
      quantity_kg: number;
      price_per_kg: number;
      status: string;
      mandi_name: string;
    }>
  ) =>
    apiCall<Listing>(`/api/listings/${listingId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: async (listingId: number) =>
    apiCall<{ deleted: boolean; listing_id: number }>(`/api/listings/${listingId}`, {
      method: "DELETE",
    }),
  listBids: async (listingId: number) =>
    apiCall<{ items: BidRecord[]; total: number }>(`/api/listings/${listingId}/bids`),
  createBid: async (
    listingId: number,
    payload: { quantity_kg: number; bid_price_per_kg: number; note?: string }
  ) =>
    apiCall<BidRecord>(`/api/listings/${listingId}/bids`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  acceptBid: async (listingId: number, bidId: number) =>
    apiCall<{
      accepted_bid: BidRecord;
      order: OrderRecord;
      listing: Listing;
    }>(`/api/listings/${listingId}/bids/${bidId}/accept`, {
      method: "POST",
    }),
};

export const ordersApi = {
  create: async (listingId: number, quantityKg: number) =>
    apiCall<OrderRecord>("/api/orders", {
      method: "POST",
      body: JSON.stringify({ listing_id: listingId, quantity_kg: quantityKg }),
    }),
  get: async (orderId: number) => apiCall<OrderDetailResponse>(`/api/orders/${orderId}`),
  getByUser: async (userId: number) =>
    apiCall<{ items: OrderRecord[]; total: number }>(`/api/orders/user/${userId}`),
  pay: async (orderId: number, payload?: { payment_method?: string; transaction_reference?: string }) =>
    apiCall<{ order: OrderRecord; transaction: PaymentTransaction }>(`/api/orders/${orderId}/pay`, {
      method: "POST",
      body: JSON.stringify(payload || { payment_method: "upi" }),
    }),
};

export const marketApi = {
  getPrices: async (crop: string, state?: string, days = 7) => {
    const params = new URLSearchParams({ crop, days: String(days) });
    if (state) params.set("state", state);
    return apiCall<MarketPriceResponse>(`/api/market/prices?${params.toString()}`);
  },
  comparePrices: async (crop: string) =>
    apiCall<PriceComparison>(`/api/market/compare?crop=${encodeURIComponent(crop)}`),
  getBestMandi: async (crop: string) =>
    apiCall<BestMandiResponse>(`/api/market/best-mandi?crop=${encodeURIComponent(crop)}`),
};

export const advisoryApi = {
  askQuestion: async (
    query: string,
    language = "hi-IN",
    crop?: string,
    soilType?: string,
    season?: string
  ) =>
    apiCall<AdvisoryResponse>("/api/advisory/query", {
      method: "POST",
      body: JSON.stringify({
        query,
        language,
        crop,
        soil_type: soilType,
        season,
      }),
    }),
  recommendCrops: async (
    soilType: string,
    season: string,
    waterAvailability: string,
    marketDemand?: string,
    areaHectares?: number
  ) =>
    apiCall<CropRecommendation[]>("/api/advisory/recommend-crop", {
      method: "POST",
      body: JSON.stringify({
        soil_type: soilType,
        season,
        water_availability: waterAvailability,
        market_demand: marketDemand,
        area_hectares: areaHectares,
      }),
    }),
  getHistory: async (limit = 20) =>
    apiCall<AdvisoryHistoryResponse>(`/api/advisory/history?limit=${limit}`),
};

export const aiApi = {
  detectDiseaseFromImage: async (
    imageBase64: string,
    analysisType = "disease",
    crop?: string
  ) => {
    const formData = new FormData();
    formData.append("image_base64", imageBase64);
    formData.append("analysis_type", analysisType);
    if (crop) {
      formData.append("crop", crop);
    }
    return apiCall<DiseaseDetection>("/api/ai/disease-detect", {
      method: "POST",
      body: formData,
    });
  },
  pricePrediction: async (
    crop: string,
    options?: { state?: string; season?: string; weather_risk?: number; demand_score?: number }
  ) => {
    const params = new URLSearchParams({ crop });
    if (options?.state) params.set("state", options.state);
    if (options?.season) params.set("season", options.season);
    if (options?.weather_risk !== undefined) params.set("weather_risk", String(options.weather_risk));
    if (options?.demand_score !== undefined) params.set("demand_score", String(options.demand_score));
    return apiCall<PricePredictionResponse>(`/api/ai/price-prediction?${params.toString()}`);
  },
  demandForecast: async (crop?: string, lookaheadDays = 14) => {
    const params = new URLSearchParams({ lookahead_days: String(lookaheadDays) });
    if (crop) params.set("crop", crop);
    return apiCall<DemandForecastResponse>(`/api/ai/demand-forecast?${params.toString()}`);
  },
};

export const analyticsApi = {
  revenue: async () =>
    apiCall<{
      total_revenue: number;
      paid_revenue: number;
      pending_revenue: number;
      orders_count: number;
    }>("/api/analytics/revenue"),
  cropTrends: async () =>
    apiCall<{
      items: Array<{
        crop: string;
        active_listings: number;
        quantity_kg: number;
        avg_price_per_kg: number;
      }>;
    }>("/api/analytics/crop-trends"),
  marketDemand: async () =>
    apiCall<{
      items: Array<{
        crop: string;
        demand_kg: number;
        recommended_price_per_kg: number;
      }>;
    }>("/api/analytics/market-demand"),
  dashboard: async () => apiCall<DashboardAnalytics>("/api/analytics/dashboard"),
};

export const logisticsApi = {
  createRequest: async (payload: {
    crop_type: string;
    quantity_kg: number;
    pickup_location: string;
    pickup_lat?: number;
    pickup_lng?: number;
    destination_mandi: string;
    destination_state?: string;
    truck_type?: string;
    scheduled_date?: string;
    scheduled_time?: string;
  }) =>
    apiCall<TransportRequest>("/api/logistics/request", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getRequestStatus: async (requestId: number) =>
    apiCall<TransportRequest>(`/api/logistics/status/${requestId}`),
  getHistory: async (limit = 10) =>
    apiCall<LogisticsHistoryResponse>(`/api/logistics/history?limit=${limit}`),
  optimizeMilkRun: async (cropType: string, destinationMandi: string, state?: string) =>
    apiCall<MilkRunRoute>("/api/logistics/milk-run/optimize", {
      method: "POST",
      body: JSON.stringify({
        crop_type: cropType,
        destination_mandi: destinationMandi,
        state,
      }),
    }),
  getQuote: async (
    origin: string,
    destination: string,
    cropType: string,
    quantityKg: number,
    truckType = "mini_truck"
  ) =>
    apiCall<{
      origin: string;
      destination: string;
      crop_type: string;
      quantity_kg: number;
      truck_type: string;
      base_price: number;
      distance_km: number;
      estimated_delivery_hours: number;
      milk_run_savings: number;
    }>(
      `/api/logistics/quote?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&crop_type=${encodeURIComponent(cropType)}&quantity_kg=${quantityKg}&truck_type=${truckType}`
    ),
};

export const voiceApi = {
  processVoiceQuery: async (
    audioBase64: string,
    language = "hi-IN",
    queryType = "advisory"
  ) => {
    const formData = new FormData();
    formData.append("audio_base64", audioBase64);
    formData.append("language", language);
    formData.append("query_type", queryType);
    return apiCall<VoiceQueryResponse>("/api/voice/query", {
      method: "POST",
      body: formData,
    });
  },
};

export const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null;
  const SpeechRecognition =
    (window as typeof window & { SpeechRecognition?: new () => unknown }).SpeechRecognition ||
    (window as typeof window & { webkitSpeechRecognition?: new () => unknown })
      .webkitSpeechRecognition;
  return SpeechRecognition ? new SpeechRecognition() : null;
};

const api = {
  authApi,
  farmersApi,
  farmsApi,
  listingsApi,
  ordersApi,
  marketApi,
  advisoryApi,
  aiApi,
  analyticsApi,
  logisticsApi,
  voiceApi,
  getSpeechRecognition,
};

export default api;
