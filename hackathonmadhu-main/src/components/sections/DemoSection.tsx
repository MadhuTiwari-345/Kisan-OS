"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, MapPin, Mic, MicOff, Phone, Search, Truck, User, X } from "lucide-react";

import { FadeIn } from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cropData, languages, marketNames } from "@/lib/constants";

interface DemoResult {
  crop: string;
  marketA: { name: string; price: number };
  marketB: { name: string; price: number };
  unit: string;
  suggestion: string;
  demandSignal: string;
  logisticsNote: string;
  spokenReply: string;
}

interface RecognitionAlternative {
  transcript: string;
}

interface RecognitionResultItem {
  isFinal: boolean;
  0: RecognitionAlternative;
}

interface RecognitionResultListLike {
  length: number;
  [index: number]: RecognitionResultItem;
}

interface RecognitionEventLike {
  resultIndex: number;
  results: RecognitionResultListLike;
}

interface RecognitionErrorEventLike {
  error: string;
}

interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const langCodes: Record<string, string> = {
  English: "en-IN",
  Hindi: "hi-IN",
  Bengali: "bn-IN",
  Telugu: "te-IN",
  Marathi: "mr-IN",
  Tamil: "ta-IN",
  Urdu: "ur-IN",
  Gujarati: "gu-IN",
  Kannada: "kn-IN",
  Odia: "or-IN",
  Malayalam: "ml-IN",
  Punjabi: "pa-IN",
  Assamese: "as-IN",
  Nepali: "ne-IN",
};

const cropAliases: Record<string, string[]> = {
  wheat: ["wheat", "gehun", "gehu", "गेहूं", "गेहू", "गेहु"],
  rice: ["rice", "dhaan", "paddy", "धान"],
  tomato: ["tomato", "tamatar", "टमाटर"],
  onion: ["onion", "pyaz", "pyaaz", "प्याज", "पियाज"],
  potato: ["potato", "aloo", "आलू", "आलु"],
  cotton: ["cotton", "kapas", "कपास"],
  soybean: ["soybean", "soyabean", "सोयाबीन", "soy"],
  mustard: ["mustard", "sarson", "सरसों"],
  maize: ["maize", "corn", "makka", "मक्का"],
  sugarcane: ["sugarcane", "ganna", "गन्ना"],
};

const demoSignals: Record<string, { demandSignal: string; logisticsNote: string }> = {
  wheat: { demandSignal: "High buyer demand in North India", logisticsNote: "Shared pickup available for Khanna and Azadpur routes." },
  rice: { demandSignal: "Stable wholesale demand with strong mandi turnover", logisticsNote: "Best shipped in early morning slots for faster unloading." },
  tomato: { demandSignal: "Fresh produce demand is rising this week", logisticsNote: "Priority transport recommended because spoilage risk is high." },
  onion: { demandSignal: "Storage-backed demand is improving", logisticsNote: "Consolidated truck routes reduce cost for onion batches." },
  potato: { demandSignal: "Retail demand is steady across nearby mandis", logisticsNote: "Cold-chain truck suggestion available for larger loads." },
  cotton: { demandSignal: "Procurement mills are paying a premium", logisticsNote: "Bulk route optimization lowers cost for long-haul delivery." },
  soybean: { demandSignal: "Oil-processing demand remains strong", logisticsNote: "Cluster pickup works well for soybean-producing villages." },
  mustard: { demandSignal: "Oil mill demand is expanding this cycle", logisticsNote: "Fast pickup slots are available for mandi transfer." },
  maize: { demandSignal: "Feed-market demand is trending upward", logisticsNote: "Milk-run routing can combine nearby maize orders." },
  sugarcane: { demandSignal: "Mill intake is steady in current season", logisticsNote: "Direct dispatch to nearest mill saves transport spend." },
};

function resolveCropFromQuery(query: string) {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return null;

  if (cropData[normalizedQuery]) {
    return normalizedQuery;
  }

  return (
    Object.entries(cropAliases).find(([, aliases]) =>
      aliases.some((alias) => normalizedQuery.includes(alias.toLowerCase()))
    )?.[0] || null
  );
}

export function DemoSection() {
  const [language, setLanguage] = useState("English");
  const [crop, setCrop] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pickupRequested, setPickupRequested] = useState(false);
  const [showPickupForm, setShowPickupForm] = useState(false);
  const [pickupForm, setPickupForm] = useState({ name: "", mobile: "", location: "", timing: "" });
  const [pickupErrors, setPickupErrors] = useState<Record<string, string>>({});
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  function createRecognition() {
    const WindowWithSpeech = window as typeof window & {
      SpeechRecognition?: new () => BrowserSpeechRecognition;
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    };
    const SpeechRecognitionCtor =
      WindowWithSpeech.SpeechRecognition || WindowWithSpeech.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return null;
    return new SpeechRecognitionCtor();
  }

  const resetPickupState = () => {
    setShowPickupForm(false);
    setPickupRequested(false);
    setPickupErrors({});
    setOtpSent(false);
    setOtp("");
    setOtpVerified(false);
    setPickupForm({ name: "", mobile: "", location: "", timing: "" });
  };

  const handleVoiceInput = useCallback(() => {
    setResult(null);
    setPickupRequested(false);
    setNotFound(false);

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = createRecognition();
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome for the demo.");
      return;
    }

    recognitionRef.current = recognition;
    recognition.lang = langCodes[language] || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    let finalTranscript = "";
    setIsListening(true);

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript = transcript.toLowerCase().trim();
        } else {
          interim = transcript;
        }
      }
      if (interim) setCrop(interim.toLowerCase().trim());
      if (finalTranscript) setCrop(finalTranscript);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      recognitionRef.current = null;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        alert("Microphone permission was denied. Allow microphone access and try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }, [isListening, language]);

  const handleSearch = useCallback(() => {
    const normalizedCrop = resolveCropFromQuery(crop);
    const data = normalizedCrop ? cropData[normalizedCrop] : null;

    if (!normalizedCrop || !data) {
      setResult(null);
      setNotFound(true);
      resetPickupState();
      return;
    }

    setNotFound(false);
    setIsLoading(true);
    resetPickupState();
    setResult(null);

    setTimeout(() => {
      const names = marketNames[normalizedCrop] || { a: "Market A", b: "Market B" };
      const signal = demoSignals[normalizedCrop] || {
        demandSignal: "Demand signal available from AI forecast.",
        logisticsNote: "Logistics planning can be generated for this crop.",
      };
      const bestMarket =
        data.marketA >= data.marketB
          ? `${names.a} at Rs ${data.marketA.toLocaleString("en-IN")}`
          : `${names.b} at Rs ${data.marketB.toLocaleString("en-IN")}`;

      setResult({
        crop: normalizedCrop,
        marketA: { name: names.a, price: data.marketA },
        marketB: { name: names.b, price: data.marketB },
        unit: data.unit,
        suggestion: data.suggestion,
        demandSignal: signal.demandSignal,
        logisticsNote: signal.logisticsNote,
        spokenReply: `${normalizedCrop} ke liye sabse achha mandi option ${bestMarket}. ${data.suggestion}`,
      });
      setIsLoading(false);
    }, 900);
  }, [crop]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const bestMarket = result && result.marketA.price >= result.marketB.price ? "A" : "B";

  return (
    <section id="demo" className="relative py-24 md:py-28">
      <Container>
        <div className="landing-section-shell rounded-[1.75rem] px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
          <div className="relative z-10">
            <SectionHeading
              eyebrow="Live Demo"
              title="Prototype the farmer flow in one screen"
              subtitle="Ask in English or Hindi, compare mandi prices, and move directly into logistics confirmation from the same workflow."
            />

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
              <FadeIn>
                <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.035] p-6 backdrop-blur-sm md:p-8">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="language-select" className="mb-2 block text-sm font-semibold text-white">
                        Language
                      </label>
                      <select
                        id="language-select"
                        value={language}
                        onChange={(event) => setLanguage(event.target.value)}
                        className="app-select"
                      >
                        {languages.map((lang) => (
                          <option key={lang} value={lang} className="bg-[#111] text-white">
                            {lang}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="crop-input" className="mb-2 block text-sm font-semibold text-white">
                        Crop name
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            id="crop-input"
                            type="text"
                            value={crop}
                            onChange={(event) => {
                              setCrop(event.target.value);
                              setNotFound(false);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="wheat, onion, tomato, cotton..."
                            className="app-input pr-11"
                          />
                          <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
                        </div>
                        <button
                          type="button"
                          onClick={handleVoiceInput}
                          className={`flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl border transition-all ${
                            isListening
                              ? "border-red-400/35 bg-red-500/10 text-red-300"
                              : "border-[#33ccb3]/25 bg-[#33ccb3]/10 text-[#dff8bc]"
                          }`}
                          aria-label={isListening ? "Stop listening" : "Start voice input"}
                        >
                          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-white/52">
                      Try: wheat, rice, onion, potato, cotton, soybean, mustard, maize
                    </p>
                    {isListening && <p className="text-sm font-medium text-[#dff8bc]">Listening in {language}...</p>}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {["wheat", "onion", "tomato", "cotton"].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setCrop(suggestion);
                          setNotFound(false);
                        }}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/66 transition-colors hover:border-[#d8f8b0]/25 hover:text-white"
                      >
                        {suggestion}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setCrop("मुझे गेहूं का भाव बताओ");
                        setLanguage("Hindi");
                        setNotFound(false);
                      }}
                      className="rounded-full border border-[#cf40ff]/25 bg-[#cf40ff]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/80 transition-colors hover:border-[#cf40ff]/45"
                    >
                      Hindi voice query
                    </button>
                  </div>

                  <Button className="mt-6 w-full md:w-auto" onClick={handleSearch} disabled={!crop.trim() || isLoading}>
                    {isLoading ? "Fetching prices..." : "Get market prices"}
                    {!isLoading && <ArrowRight className="h-4 w-4" />}
                  </Button>

                  <AnimatePresence mode="wait">
                    {isLoading && (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-8 rounded-[1.25rem] border border-white/8 bg-black/15 p-8 text-center"
                      >
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-[#dff8bc]/30 border-t-[#dff8bc]" />
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#dff8bc]">
                          Syncing market signals
                        </p>
                        <p className="mt-2 text-sm text-white/58">
                          Pulling benchmark mandi prices and generating a recommendation.
                        </p>
                      </motion.div>
                    )}

                    {!isLoading && result && (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="mt-8 space-y-5"
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <div
                            className={`rounded-[1.25rem] border p-5 ${
                              bestMarket === "A"
                                ? "border-[#33ccb3]/25 bg-[#33ccb3]/10"
                                : "border-white/8 bg-white/[0.03]"
                            }`}
                          >
                            <p className="text-sm text-white/55">{result.marketA.name}</p>
                            <p className="mt-2 text-3xl font-black text-white">
                              Rs {result.marketA.price.toLocaleString("en-IN")}
                            </p>
                            <p className="mt-1 text-sm text-white/48">{result.unit}</p>
                            {bestMarket === "A" && (
                              <span className="mt-3 inline-flex rounded-full bg-[#dff8bc]/14 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#dff8bc]">
                                Best price
                              </span>
                            )}
                          </div>

                          <div
                            className={`rounded-[1.25rem] border p-5 ${
                              bestMarket === "B"
                                ? "border-[#33ccb3]/25 bg-[#33ccb3]/10"
                                : "border-white/8 bg-white/[0.03]"
                            }`}
                          >
                            <p className="text-sm text-white/55">{result.marketB.name}</p>
                            <p className="mt-2 text-3xl font-black text-white">
                              Rs {result.marketB.price.toLocaleString("en-IN")}
                            </p>
                            <p className="mt-1 text-sm text-white/48">{result.unit}</p>
                            {bestMarket === "B" && (
                              <span className="mt-3 inline-flex rounded-full bg-[#dff8bc]/14 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#dff8bc]">
                                Best price
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="rounded-[1.25rem] border border-[#d8f8b0]/15 bg-[#d8f8b0]/8 p-5">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#dff8bc]">
                            Recommended action
                          </p>
                          <p className="mt-3 text-sm leading-7 text-white/78">{result.suggestion}</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-5">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#dff8bc]">Voice answer</p>
                            <p className="mt-3 text-sm leading-7 text-white/72">{result.spokenReply}</p>
                          </div>
                          <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-5">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#dff8bc]">Demand forecast</p>
                            <p className="mt-3 text-sm leading-7 text-white/72">{result.demandSignal}</p>
                          </div>
                          <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-5">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#dff8bc]">Logistics note</p>
                            <p className="mt-3 text-sm leading-7 text-white/72">{result.logisticsNote}</p>
                          </div>
                        </div>

                        {!showPickupForm && !pickupRequested && (
                          <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setShowPickupForm(true)}>
                            <Truck className="h-4 w-4" />
                            Request pickup
                          </Button>
                        )}

                        <AnimatePresence>
                          {showPickupForm && !pickupRequested && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="rounded-[1.25rem] border border-white/8 bg-black/15 p-5">
                                <div className="mb-5 flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-white">Pickup details</p>
                                    <p className="mt-1 text-sm text-white/52">
                                      Use this as your logistics confirmation flow in the prototype.
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setShowPickupForm(false)}
                                    className="rounded-xl border border-white/8 p-2 text-white/48 transition-colors hover:text-white"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
                                      <User className="mr-1 inline h-3 w-3" />
                                      Full name
                                    </label>
                                    <input
                                      type="text"
                                      value={pickupForm.name}
                                      onChange={(event) => {
                                        setPickupForm({ ...pickupForm, name: event.target.value });
                                        setPickupErrors({ ...pickupErrors, name: "" });
                                      }}
                                      className="app-input"
                                      placeholder="Farmer or contact name"
                                    />
                                    {pickupErrors.name && <p className="mt-1 text-xs text-red-300">{pickupErrors.name}</p>}
                                  </div>

                                  <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
                                      <MapPin className="mr-1 inline h-3 w-3" />
                                      Pickup location
                                    </label>
                                    <input
                                      type="text"
                                      value={pickupForm.location}
                                      onChange={(event) => {
                                        setPickupForm({ ...pickupForm, location: event.target.value });
                                        setPickupErrors({ ...pickupErrors, location: "" });
                                      }}
                                      className="app-input"
                                      placeholder="Village, mandi gate, landmark"
                                    />
                                    {pickupErrors.location && (
                                      <p className="mt-1 text-xs text-red-300">{pickupErrors.location}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                                  <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
                                      <Phone className="mr-1 inline h-3 w-3" />
                                      Mobile number
                                    </label>
                                    <div className="flex gap-2">
                                      <input
                                        type="tel"
                                        value={pickupForm.mobile}
                                        onChange={(event) => {
                                          const value = event.target.value.replace(/\D/g, "").slice(0, 10);
                                          setPickupForm({ ...pickupForm, mobile: value });
                                          setPickupErrors({ ...pickupErrors, mobile: "" });
                                          if (otpSent) {
                                            setOtpSent(false);
                                            setOtpVerified(false);
                                            setOtp("");
                                          }
                                        }}
                                        className="app-input"
                                        placeholder="10-digit number"
                                        maxLength={10}
                                        disabled={otpVerified}
                                      />
                                      {!otpVerified && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (pickupForm.mobile.length !== 10) {
                                              setPickupErrors({
                                                ...pickupErrors,
                                                mobile: "Enter a valid 10-digit number.",
                                              });
                                              return;
                                            }
                                            setSendingOtp(true);
                                            setTimeout(() => {
                                              setSendingOtp(false);
                                              setOtpSent(true);
                                            }, 700);
                                          }}
                                          disabled={pickupForm.mobile.length !== 10 || sendingOtp}
                                          className="shrink-0 rounded-2xl border border-[#33ccb3]/25 bg-[#33ccb3]/10 px-4 text-sm font-semibold text-[#dff8bc] disabled:opacity-45"
                                        >
                                          {sendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                                        </button>
                                      )}
                                    </div>
                                    {pickupErrors.mobile && (
                                      <p className="mt-1 text-xs text-red-300">{pickupErrors.mobile}</p>
                                    )}

                                    {otpSent && !otpVerified && (
                                      <div className="mt-3 flex gap-2">
                                        <input
                                          type="text"
                                          value={otp}
                                          onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                                          className="app-input text-center tracking-[0.3em]"
                                          placeholder="OTP"
                                          maxLength={6}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (otp.length !== 6) return;
                                            setVerifyingOtp(true);
                                            setTimeout(() => {
                                              setVerifyingOtp(false);
                                              setOtpVerified(true);
                                            }, 500);
                                          }}
                                          disabled={otp.length !== 6 || verifyingOtp}
                                          className="shrink-0 rounded-2xl border border-[#33ccb3]/25 bg-[#33ccb3]/10 px-4 text-sm font-semibold text-[#dff8bc] disabled:opacity-45"
                                        >
                                          {verifyingOtp ? "Verifying..." : "Verify"}
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
                                      <Clock className="mr-1 inline h-3 w-3" />
                                      Preferred slot
                                    </label>
                                    <select
                                      value={pickupForm.timing}
                                      onChange={(event) => {
                                        setPickupForm({ ...pickupForm, timing: event.target.value });
                                        setPickupErrors({ ...pickupErrors, timing: "" });
                                      }}
                                      className="app-select"
                                    >
                                      <option value="" className="bg-[#111]">
                                        Select slot
                                      </option>
                                      <option value="6:00 AM - 8:00 AM" className="bg-[#111]">
                                        6:00 AM - 8:00 AM
                                      </option>
                                      <option value="8:00 AM - 10:00 AM" className="bg-[#111]">
                                        8:00 AM - 10:00 AM
                                      </option>
                                      <option value="10:00 AM - 12:00 PM" className="bg-[#111]">
                                        10:00 AM - 12:00 PM
                                      </option>
                                      <option value="2:00 PM - 4:00 PM" className="bg-[#111]">
                                        2:00 PM - 4:00 PM
                                      </option>
                                      <option value="4:00 PM - 6:00 PM" className="bg-[#111]">
                                        4:00 PM - 6:00 PM
                                      </option>
                                    </select>
                                    {pickupErrors.timing && (
                                      <p className="mt-1 text-xs text-red-300">{pickupErrors.timing}</p>
                                    )}
                                  </div>
                                </div>

                                <Button
                                  className="mt-5 w-full sm:w-auto"
                                  onClick={() => {
                                    const errors: Record<string, string> = {};
                                    if (!pickupForm.name.trim()) errors.name = "Name is required.";
                                    if (!pickupForm.location.trim()) errors.location = "Location is required.";
                                    if (pickupForm.mobile.length !== 10) {
                                      errors.mobile = "Valid mobile number is required.";
                                    } else if (!otpVerified) {
                                      errors.mobile = "Please verify the mobile number.";
                                    }
                                    if (!pickupForm.timing) errors.timing = "Select a time slot.";

                                    if (Object.keys(errors).length > 0) {
                                      setPickupErrors(errors);
                                      return;
                                    }

                                    setShowPickupForm(false);
                                    setPickupRequested(true);
                                  }}
                                >
                                  <Truck className="h-4 w-4" />
                                  Confirm pickup request
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {pickupRequested && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-[1.25rem] border border-[#33ccb3]/20 bg-[#33ccb3]/10 p-5"
                          >
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#dff8bc]">
                              Pickup request confirmed
                            </p>
                            <p className="mt-2 text-sm leading-7 text-white/72">
                              Driver coordination is scheduled for {pickupForm.timing}. The logistics contact will call +91 {pickupForm.mobile} before arrival.
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {notFound && !isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 rounded-[1.25rem] border border-amber-400/20 bg-amber-400/8 p-5"
                    >
                      <p className="text-sm font-semibold text-amber-200">
                        &quot;{crop}&quot; is not available in this prototype dataset yet.
                      </p>
                      <p className="mt-2 text-sm leading-7 text-white/64">
                        Try a crop name or a natural query like &quot;what is onion price&quot; or &quot;मुझे गेहूं का भाव बताओ&quot;.
                      </p>
                    </motion.div>
                  )}
                </div>
              </FadeIn>

              <FadeIn delay={0.15}>
                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.035] p-5 backdrop-blur-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#dff8bc]">Demo script</p>
                    <ol className="mt-4 space-y-3 text-sm leading-7 text-white/66">
                      <li>1. Ask for a crop using a keyword or a natural voice query.</li>
                      <li>2. Show the best mandi recommendation and spoken answer.</li>
                      <li>3. Surface demand and logistics intelligence together.</li>
                      <li>4. Confirm transport scheduling in the same screen.</li>
                    </ol>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.035] p-5 backdrop-blur-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#dff8bc]">Platform features</p>
                    <div className="mt-4 space-y-4 text-sm leading-7 text-white/66">
                      <p>Marketplace pricing, demand forecasting, and transport coordination now show up inside the same demo result.</p>
                      <p>Farmers get pricing, recommendations, and logistics in one path instead of bouncing between tools.</p>
                      <p>Buyers and admins see a clear transaction narrative that is easier to demo and judge.</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
