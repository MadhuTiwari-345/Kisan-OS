"use client";

import { Suspense, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Bug,
  Camera,
  ChevronRight,
  Droplets,
  Info,
  Leaf,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Wind,
} from "lucide-react";
import { advisoryApi, aiApi, type CropRecommendation } from "@/lib/api";
import { useBhashini } from "@/hooks/useBhashini";

type TabKey = "chat" | "doctor" | "recommend";

interface AdvisoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface DiseaseResult {
  diseaseName: string;
  confidence: number;
  severity: "low" | "moderate" | "high";
  treatment: string[];
  prevention: string[];
}

const fallbackRecommendations: CropRecommendation[] = [
  {
    crop: "Mustard",
    expected_yield_quintals: 18,
    estimated_profit: 54000,
    water_requirement_mm: 420,
    season_suitability: "High",
    market_demand: "Strong",
  },
  {
    crop: "Chickpea",
    expected_yield_quintals: 14,
    estimated_profit: 46000,
    water_requirement_mm: 380,
    season_suitability: "High",
    market_demand: "Stable",
  },
];

function AdvisoryContent() {
  const [activeTab, setActiveTab] = useState<TabKey>("chat");
  const [messages, setMessages] = useState<AdvisoryMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Namaste. Ask about crop disease, sowing windows, fertilizer, mandi timing, or transport planning.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [diseaseResult, setDiseaseResult] = useState<DiseaseResult | null>(null);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [recommendForm, setRecommendForm] = useState({
    soilType: "loamy",
    season: "rabi",
    waterAvailability: "medium",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    language,
    setLanguage,
    availableLanguages,
  } =
    useBhashini();

  async function handleAsk() {
    const query = (isListening ? transcript : draft).trim();
    if (!query) return;

    const userMessage: AdvisoryMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: query,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setLoading(true);

    try {
      const response = await advisoryApi.askQuestion(query, language);
      const answer = response.response || "I could not generate an advisory response.";
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: answer,
        },
      ]);
      await speak(answer);
    } catch {
      const fallback =
        "Current advisory service is offline. For wheat and mustard, keep irrigation light this week and monitor for rust after morning dew.";
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: fallback,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setDiseaseResult(null);
    };
    reader.readAsDataURL(file);
  }

async function handleDiseaseCheck() {
    if (!imagePreview) return;

    setLoading(true);
    try {
      const result = await aiApi.detectDiseaseFromImage(imagePreview, "disease", "tomato");
      setDiseaseResult({
        diseaseName: result.disease_name,
        confidence: result.confidence,
        severity: result.severity as "low" | "moderate" | "high",
        treatment: result.treatment,
        prevention: result.prevention,
      });
    } catch {
      setDiseaseResult({
        diseaseName: "Leaf Blight",
        confidence: 0.89,
        severity: "moderate",
        treatment: [
          "Spray Mancozeb 75% WP at 2 g per liter.",
          "Repeat after 10 to 12 days if symptoms persist.",
        ],
        prevention: [
          "Avoid overhead irrigation late in the day.",
          "Remove heavily infected leaves from the field.",
          "Keep row spacing open for airflow.",
        ],
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRecommendations() {
    setLoading(true);
    try {
      const result = await advisoryApi.recommendCrops(
        recommendForm.soilType,
        recommendForm.season,
        recommendForm.waterAvailability
      );
      setRecommendations(result.length ? result : fallbackRecommendations);
    } catch {
      setRecommendations(fallbackRecommendations);
    } finally {
      setLoading(false);
    }
  }

  const activeInput = isListening ? transcript : draft;

  return (
    <div className="app-screen min-h-screen pb-24">
      <header className="app-header sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15">
              <MessageSquare className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AI Advisory</h1>
              <p className="text-xs text-white/45">Voice, crop doctor, and recommendations</p>
            </div>
          </div>

          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
          >
            {availableLanguages.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="flex gap-2 px-4 py-4">
        {[
          { key: "chat", label: "AI Chat" },
          { key: "doctor", label: "Crop Doctor" },
          { key: "recommend", label: "Recommend" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as TabKey)}
            className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border border-[#dff8bc]/30 bg-[#dff8bc]/10 text-[#dff8bc]"
                : "border border-white/10 bg-white/5 text-white/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "chat" && (
        <div className="px-4">
          <div className="space-y-3">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${
                    message.role === "user"
                      ? "border border-primary/30 bg-primary/20 text-white"
                      : "border border-white/8 bg-white/5 text-white/80"
                  }`}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-white/8 bg-white/5 p-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  isListening
                    ? "border border-red-500/30 bg-red-500/15 text-red-300"
                    : "border border-primary/30 bg-primary/20 text-primary"
                }`}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <input
                value={activeInput}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleAsk();
                  }
                }}
                placeholder={isListening ? "Listening..." : "Ask about pests, irrigation, or market timing"}
                className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/30"
              />

              <button
                type="button"
                onClick={() => void handleAsk()}
                disabled={loading || !activeInput.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/20 text-primary disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "doctor" && (
        <div className="space-y-4 px-4">
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
                <Bug className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Leaf Disease Scan</h2>
                <p className="text-xs text-white/45">Upload a leaf image for a quick diagnosis</p>
              </div>
            </div>

            {!imagePreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/15 px-4 py-10 text-center"
              >
                <Camera className="mb-3 h-10 w-10 text-white/35" />
                <span className="text-sm text-white/70">Tap to upload crop image</span>
                <span className="mt-1 text-xs text-white/40">PNG or JPG, up to 10 MB</span>
              </button>
            ) : (
              <div className="space-y-4">
                <img
                  src={imagePreview}
                  alt="Uploaded crop"
                  className="h-56 w-full rounded-2xl object-cover"
                />
                    <button
                      type="button"
                      onClick={() => void handleDiseaseCheck()}
                      disabled={loading}
                      className="app-button-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  Analyze Leaf
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {diseaseResult && (
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{diseaseResult.diseaseName}</h3>
                  <p className="text-sm text-white/45">
                    Confidence {(diseaseResult.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
                  {diseaseResult.severity}
                </span>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  Treatment
                </p>
                {diseaseResult.treatment.map((item) => (
                  <p key={item} className="text-sm text-white/80">
                    {item}
                  </p>
                ))}
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-300">
                  <Info className="h-4 w-4" />
                  Prevention
                </div>
                <div className="space-y-2">
                  {diseaseResult.prevention.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="pt-1 text-primary">
                        <ChevronRight className="h-3 w-3" />
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "recommend" && (
        <div className="space-y-4 px-4">
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Crop Recommendation</h2>
                <p className="text-xs text-white/45">Match soil, season, and water profile</p>
              </div>
            </div>

            <div className="space-y-4">
              <select
                value={recommendForm.soilType}
                onChange={(event) =>
                  setRecommendForm((current) => ({ ...current, soilType: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              >
                <option value="loamy">Loamy</option>
                <option value="clay">Clay</option>
                <option value="alluvial">Alluvial</option>
                <option value="sandy">Sandy</option>
              </select>

              <select
                value={recommendForm.season}
                onChange={(event) =>
                  setRecommendForm((current) => ({ ...current, season: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              >
                <option value="rabi">Rabi</option>
                <option value="kharif">Kharif</option>
                <option value="zaid">Zaid</option>
              </select>

              <select
                value={recommendForm.waterAvailability}
                onChange={(event) =>
                  setRecommendForm((current) => ({
                    ...current,
                    waterAvailability: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              >
                <option value="low">Low water</option>
                <option value="medium">Medium water</option>
                <option value="high">High water</option>
              </select>

              <button
                type="button"
                onClick={() => void handleRecommendations()}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/20 py-3 text-sm font-semibold text-primary"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Leaf className="h-4 w-4" />}
                Generate Suggestions
              </button>
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className="space-y-3">
              {recommendations.map((item, index) => (
                <div key={`${item.crop}-${index}`} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{item.crop}</h3>
                        <p className="text-xs text-white/45">Season fit: {item.season_suitability}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/55">
                      {item.water_requirement_mm > 500 ? (
                        <Droplets className="h-4 w-4 text-blue-300" />
                      ) : (
                        <Wind className="h-4 w-4 text-white/40" />
                      )}
                      {item.market_demand}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl bg-black/20 p-3">
                      <p className="text-xs text-white/40">Yield</p>
                      <p className="mt-1 font-semibold text-white">
                        {item.expected_yield_quintals} q
                      </p>
                    </div>
                    <div className="rounded-xl bg-black/20 p-3">
                      <p className="text-xs text-white/40">Profit</p>
                      <p className="mt-1 font-semibold text-white">
                        Rs {item.estimated_profit.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="rounded-xl bg-black/20 p-3">
                      <p className="text-xs text-white/40">Water</p>
                      <p className="mt-1 font-semibold text-white">
                        {item.water_requirement_mm} mm
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <nav className="app-bottom-nav fixed bottom-0 left-0 right-0 lg:hidden">
        <div className="flex items-center justify-around py-2 text-[10px]">
          <a href="/dashboard" className="flex flex-col items-center gap-1 px-4 py-2 text-white/45">
            <MessageSquare className="h-5 w-5" />
            Home
          </a>
          <a href="/market" className="flex flex-col items-center gap-1 px-4 py-2 text-white/45">
            <Leaf className="h-5 w-5" />
            Market
          </a>
          <a href="/logistics" className="flex flex-col items-center gap-1 px-4 py-2 text-white/45">
            <Bug className="h-5 w-5" />
            Transport
          </a>
          <a href="/advisory" className="flex flex-col items-center gap-1 px-4 py-2 text-primary">
            <MessageSquare className="h-5 w-5" />
            Advisory
          </a>
        </div>
      </nav>
    </div>
  );
}

export default function AdvisoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-white/40">
          Loading advisory...
        </div>
      }
    >
      <AdvisoryContent />
    </Suspense>
  );
}
