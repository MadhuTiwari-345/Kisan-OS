"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Type declarations
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const window: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface BhashiniConfig {
  pipelineId: string;
  responseType: string;
  language: {
    sourceLanguage: string;
    targetLanguage?: string;
  };
  context: {
    information: string;
  };
}

interface STTResult {
  text: string;
  language: string;
  confidence: number;
  dialect?: string;
}

interface TTSResult {
  audio_base64: string;
  audio_content_type: string;
}

interface TranslationResult {
  translated_text: string;
  source_language: string;
  target_language: string;
}

interface VoiceQueryResult {
  query_text: string;
  translated_query?: string;
  response_text: string;
  response_audio_base64?: string;
  language: string;
  intent?: string;
  entities?: Record<string, string>;
}

interface UseBhashiniFullReturn {
  // State
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  audioLevel: number;
  
  // Language settings
  sourceLanguage: string;
  targetLanguage: string;
  availableSourceLanguages: LanguageInfo[];
  availableTargetLanguages: LanguageInfo[];
  
  // Farm context
  farmContext: FarmContext | null;
  
  // Actions
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, language?: string) => Promise<void>;
  stopSpeaking: () => void;
  setSourceLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
  setFarmContext: (context: FarmContext) => void;
  
  // Advanced functions
  processVoiceQuery: (queryType?: "advisory" | "market" | "logistics") => Promise<VoiceQueryResult | null>;
  transcriptToText: (audioBlob: Blob) => Promise<STTResult>;
  textToSpeech: (text: string, language?: string) => Promise<TTSResult>;
  translateText: (text: string) => Promise<TranslationResult>;
}

interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  region: string;
  dialects?: string[];
}

interface FarmContext {
  farmId?: string;
  farmerName?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  soilType?: string;
  cropsGrown?: string[];
  landArea?: {
    value: number;
    unit: "acre" | "hectare";
  };
}

// Bhashini API configuration
const BHASHINI_API_BASE = "https://dhruva-api.bhashini.gov.in/services";
const BHASHINI_USER_ID = process.env.NEXT_PUBLIC_BHASHINI_USER_ID || "";
const BHASHINI_API_KEY = process.env.NEXT_PUBLIC_BHASHINI_API_KEY || "";

// Supported languages with detailed info
export const BHASHINI_LANGUAGES: LanguageInfo[] = [
  // Scheduled Languages (22)
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", region: "Northeast" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", region: "East" },
  { code: "bodo", name: "Bodo", nativeName: "बोडो", region: "Northeast" },
  { code: "dogri", name: "Dogri", nativeName: "डोगरी", region: "North" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", region: "West" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", region: "North", dialects: ["Bhojpuri", "Awadhi", "Rajasthani", "Maithili", "Haryanvi"] },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", region: "South" },
  { code: "ks", name: "Kashmiri", nativeName: "कश्मीरी", region: "North" },
  { code: "kok", name: "Konkani", nativeName: "कोंकणी", region: "West" },
  { code: "mai", name: "Maithili", nativeName: "मैथिली", region: "East" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", region: "South" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", region: "West", dialects: ["Konkani", "Varhadi"] },
  { code: "mni", name: "Manipuri", nativeName: "মৈতৈলো", region: "Northeast" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", region: "North" },
  { code: "or", name: "Odia", nativeName: "ଓଡିଆ", region: "East" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", region: "North" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृत", region: "North" },
  { code: "sat", name: "Santali", nativeName: "संताली", region: "East" },
  { code: "sd", name: "Sindhi", nativeName: "सिंधी", region: "West" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", region: "South" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", region: "South" },
  { code: "ur", name: "Urdu", nativeName: "اردو", region: "North" },
  // Additional
  { code: "en", name: "English", nativeName: "English", region: "National" },
];

// Dialect mappings for Hindi
const HINDI_DIALECTS: Record<string, string> = {
  bhojpuri: "Bhojpuri",
  awadhi: "Awadhi",
  rajasthani: "Rajasthani",
  braj: "Braj",
  maithili: "Maithili",
  haryanvi: "Haryanvi",
};

// Audio context for visualization
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
const mediaStream: MediaStream | null = null;

export function useBhashiniFull() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const [sourceLanguage, setSourceLanguageState] = useState("hi");
  const [targetLanguage, setTargetLanguageState] = useState("en");
  const [farmContext, setFarmContextState] = useState<FarmContext | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);

  // Get available languages
  const availableSourceLanguages = BHASHINI_LANGUAGES;
  const availableTargetLanguages = BHASHINI_LANGUAGES.filter(l => l.code !== sourceLanguage);

  // Initialize audio context for visualization
  const initAudioContext = useCallback(async () => {
    if (typeof window === "undefined") return;
    
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext!.createAnalyser();
      analyser.fftSize = 256;
    } catch (err) {
      console.error("Failed to init audio context:", err);
    }
  }, []);

  // Start audio visualization
  const startAudioVisualization = useCallback(async (stream: MediaStream) => {
    if (!analyser || !audioContext) {
      await initAudioContext();
    }
    
    if (!audioContext || !analyser) return;
    
    try {
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(average / 255);
        if (isListening) {
          requestAnimationFrame(updateLevel);
        }
      };
      
      updateLevel();
    } catch (err) {
      console.error("Audio visualization error:", err);
    }
  }, [initAudioContext, isListening]);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Check speech recognition support
  const isSpeechRecognitionSupported = typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSpeechRecognitionSupported) {
      setError("Speech recognition not supported. Please use Chrome or Edge.");
      return;
    }

    setError(null);
    setTranscript("");
    setInterimTranscript("");
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Map language code for Web Speech API
    const langMap: Record<string, string> = {
      "hi": "hi-IN", "bn": "bn-IN", "ta": "ta-IN", "te": "te-IN",
      "mr": "mr-IN", "gu": "gu-IN", "kn": "kn-IN", "pa": "pa-IN",
      "or": "or-IN", "ur": "ur-IN", "ml": "ml-IN", "as": "as-IN",
      "ne": "ne-IN", "en": "en-IN"
    };
    
    recognition.lang = langMap[sourceLanguage] || `${sourceLanguage}-IN`;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let final = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript(final);
        setInterimTranscript("");
      } else if (interim) {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
      setAudioLevel(0);
    };

    recognition.onend = () => {
      setIsListening(false);
      setAudioLevel(0);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [sourceLanguage, isSpeechRecognitionSupported]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setAudioLevel(0);
    }
  }, []);

  // Speak text using Web Speech API
  const speak = useCallback(async (text: string, language?: string) => {
    if (!synthRef.current) {
      setError("Text-to-speech not supported");
      return;
    }

    const targetLang = language || sourceLanguage;
    setIsSpeaking(true);
    setError(null);

    synthRef.current.cancel();

    const voices = synthRef.current.getVoices();
    const langCode = targetLang;
    
    let selectedVoice = voices.find((v: any) => 
      v.lang.startsWith(langCode) || v.lang.startsWith(targetLang)
    );
    
    if (!selectedVoice) {
      selectedVoice = voices.find((v: any) => v.lang.startsWith("en"));
    }

    const utterance = new window.SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.lang = `${targetLang}-IN`;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setError("Text-to-speech error");
      setIsSpeaking(false);
    };

    synthRef.current.speak(utterance);
  }, [sourceLanguage]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Set language helpers
  const setSourceLanguage = useCallback((lang: string) => {
    setSourceLanguageState(lang);
  }, []);

  const setTargetLanguage = useCallback((lang: string) => {
    setTargetLanguageState(lang);
  }, []);

  const setFarmContext = useCallback((context: FarmContext) => {
    setFarmContextState(context);
  }, []);

  // Process voice query with backend
  const processVoiceQuery = useCallback(async (
    queryType: "advisory" | "market" | "logistics" = "advisory"
  ): Promise<VoiceQueryResult | null> => {
    if (!transcript.trim()) {
      setError("No transcript available");
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("access_token");

      // Build context string
      let contextInfo = "";
      if (farmContext) {
        contextInfo = `\n\nContext: Farmer at location ${farmContext.location?.latitude || ""}, ${farmContext.location?.longitude || ""}`;
        if (farmContext.soilType) contextInfo += `, Soil type: ${farmContext.soilType}`;
        if (farmContext.cropsGrown?.length) contextInfo += `, Crops: ${farmContext.cropsGrown.join(", ")}`;
      }

      const response = await fetch(`${baseUrl}/api/voice/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          query: transcript + contextInfo,
          source_language: sourceLanguage,
          target_language: targetLanguage,
          query_type: queryType,
        }),
      });

      if (!response.ok) {
        throw new Error("Voice query failed");
      }

      const result = await response.json();
      
      // Auto-speak the response if it's in the same language
      if (result.response_audio_base64) {
        const audio = new Audio(`data:audio/wav;base64,${result.response_audio_base64}`);
        audio.play();
      } else if (result.response_text && sourceLanguage !== "en") {
        // Convert response to speech
        await speak(result.response_text);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      
      // Fallback: return mock response
      return {
        query_text: transcript,
        response_text: getFallbackResponse(transcript, queryType),
        language: sourceLanguage,
        intent: "fallback",
      };
    } finally {
      setIsProcessing(false);
    }
  }, [transcript, sourceLanguage, targetLanguage, farmContext, speak]);

  // Send audio to backend for STT
  const transcriptToText = useCallback(async (audioBlob: Blob): Promise<STTResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("access_token");
      
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("language", sourceLanguage);

      const response = await fetch(`${baseUrl}/api/voice/stt`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process audio");
      }

      const result = await response.json();
      
      return {
        text: result.text,
        language: result.language || sourceLanguage,
        confidence: result.confidence || 0.9,
        dialect: result.dialect,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [sourceLanguage]);

  // Text to Speech via API
  const textToSpeech = useCallback(async (text: string, language?: string): Promise<TTSResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("access_token");
      const targetLang = language || targetLanguage;

      const response = await fetch(`${baseUrl}/api/voice/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          text,
          language: targetLang,
          gender: "female",
        }),
      });

      if (!response.ok) {
        throw new Error("TTS failed");
      }

      const result = await response.json();
      
      return {
        audio_base64: result.audio,
        audio_content_type: result.content_type || "audio/wav",
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [targetLanguage]);

  // Translate text
  const translateText = useCallback(async (text: string): Promise<TranslationResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("access_token");

      const response = await fetch(`${baseUrl}/api/voice/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          text,
          source_language: sourceLanguage,
          target_language: targetLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error("Translation failed");
      }

      const result = await response.json();
      
      return {
        translated_text: result.translated_text,
        source_language: sourceLanguage,
        target_language: targetLanguage,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [sourceLanguage, targetLanguage]);

  return {
    isListening,
    isProcessing,
    isSpeaking,
    transcript: interimTranscript || transcript,
    interimTranscript,
    error,
    audioLevel,
    sourceLanguage,
    targetLanguage,
    availableSourceLanguages,
    availableTargetLanguages,
    farmContext,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setSourceLanguage,
    setTargetLanguage,
    setFarmContext,
    processVoiceQuery,
    transcriptToText,
    textToSpeech,
    translateText,
  };
}

// Fallback responses for offline/demo mode
function getFallbackResponse(query: string, queryType: string): string {
  const q = query.toLowerCase();
  
  if (queryType === "market") {
    if (q.includes("onion") || q.includes("प्याज")) {
      return "Today's onion prices: Azadpur ₹2,200/quintal, Lasalgaon ₹1,850/quintal. Prices are stable.";
    }
    if (q.includes("wheat") || q.includes("गेहूं")) {
      return "Wheat prices: MSP is ₹2,275/quintal. Current market price around ₹2,400.";
    }
    return "Please check the Market Radar section for current prices.";
  }
  
  if (queryType === "logistics") {
    if (q.includes("transport") || q.includes("truck") || q.includes("ट्रक")) {
      return "Transport booking available. Mini truck for 5 quintals costs around ₹1,500-2,000 for local delivery.";
    }
    return "Use the Transport section to book a truck for your produce.";
  }
  
  // Advisory
  if (q.includes("disease") || q.includes("बीमारी")) {
    return "For disease diagnosis, please upload a clear photo of the affected leaf in the Crop Doctor section.";
  }
  if (q.includes("weather") || q.includes("बारिश") || q.includes("मौसम")) {
    return "Weather forecast: Light rain expected in next 2-3 days. Protect harvested crops.";
  }
  if (q.includes("fertilizer") || q.includes("खाद")) {
    return "For optimal growth, apply urea at 120 kg/hectare in two splits. DAP at planting time.";
  }
  
  return "I can help with crop advice, market prices, and transport booking. Please ask in your language.";
}

export default useBhashiniFull;

