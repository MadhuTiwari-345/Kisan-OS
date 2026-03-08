"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FARMER_LANGUAGES } from "@/lib/languages";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const window: any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface STTResult {
  text: string;
  language: string;
  confidence: number;
}

interface UseBhashiniReturn {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  language: string;
  availableLanguages: { code: string; name: string }[];
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  setLanguage: (lang: string) => void;
  transcriptToText: (audioBlob: Blob) => Promise<STTResult>;
}

export const BHASHINI_LANGUAGES = FARMER_LANGUAGES.map((language) => ({
  code: language.code,
  name: language.label,
}));

export function useBhashini(): UseBhashiniReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguageState] = useState("hi-IN");

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
    return () => synthRef.current?.cancel();
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window?.SpeechRecognition || window?.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setTranscript("");
      setError(null);
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      setTranscript(text);
    };

    recognition.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!synthRef.current) {
        setError("Text to speech is not supported.");
        return;
      }
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.92;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        setError("Speech playback failed.");
      };
      synthRef.current.speak(utterance);
    },
    [language]
  );

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
  }, []);

  const transcriptToText = useCallback(
    async (audioBlob: Blob): Promise<STTResult> => {
      setIsProcessing(true);
      setError(null);
      try {
        const audioBase64 = await audioToBase64(audioBlob);
        const token = localStorage.getItem("access_token");
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${baseUrl}/api/voice/stt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            audio_base64: audioBase64,
            language,
            encoding: "webm",
            sample_rate: 16000,
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to process audio");
        }
        const result = await response.json();
        return {
          text: result.text,
          language: result.language,
          confidence: result.confidence ?? 0.9,
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [language]
  );

  return {
    isListening,
    isSpeaking,
    isProcessing,
    transcript,
    error,
    language,
    availableLanguages: BHASHINI_LANGUAGES,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setLanguage,
    transcriptToText,
  };
}

export async function audioToBase64(audioBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });
}

export function playAudioFromBase64(base64: string, audioFormat = "wav"): HTMLAudioElement {
  const audio = new Audio(`data:audio/${audioFormat};base64,${base64}`);
  void audio.play();
  return audio;
}

export default useBhashini;
