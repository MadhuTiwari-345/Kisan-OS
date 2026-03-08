"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface VoiceWaveformProps {
  isListening: boolean;
  audioLevel?: number;
  isSpeaking?: boolean;
}

export function VoiceWaveform({ isListening, audioLevel = 0, isSpeaking = false }: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!isListening && !isSpeaking) {
      // Draw idle state - small dots
      const dotCount = 5;
      const dotSize = 3;
      const gap = (width - dotCount * dotSize * 2) / (dotCount + 1);
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      for (let i = 0; i < dotCount; i++) {
        const x = gap + i * (dotSize * 2 + gap);
        const y = height / 2;
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    // Animate based on audio level
    const barCount = 12;
    const barWidth = 6;
    const gap = (width - barCount * barWidth) / (barCount - 1);
    const centerY = height / 2;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const targetLevel = isListening ? audioLevel : 0.3;
      
      for (let i = 0; i < barCount; i++) {
        // Create wave effect
        const offset = i * 0.3;
        const time = Date.now() / 1000;
        const wave = Math.sin(time * 3 + offset);
        
        // Calculate bar height based on position and wave
        const baseHeight = isListening ? 10 : 5;
        const maxHeight = isListening ? height * 0.4 : height * 0.2;
        const level = targetLevel + wave * 0.1;
        
        const barHeight = baseHeight + (maxHeight - baseHeight) * level * Math.abs(wave);
        const x = i * (barWidth + gap);
        const y = centerY - barHeight / 2;

        // Gradient fill
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        
        if (isListening) {
          gradient.addColorStop(0, "rgba(239, 68, 68, 0.8)");
          gradient.addColorStop(0.5, "rgba(248, 113, 113, 0.9)");
          gradient.addColorStop(1, "rgba(239, 68, 68, 0.8)");
        } else {
          gradient.addColorStop(0, "rgba(34, 197, 94, 0.8)");
          gradient.addColorStop(0.5, "rgba(74, 222, 128, 0.9)");
          gradient.addColorStop(1, "rgba(34, 197, 94, 0.8)");
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, audioLevel, isSpeaking]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={200}
        height={60}
        className="w-full h-16"
      />
      
      {/* Status indicator */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {isListening && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="h-2 w-2 rounded-full bg-red-500"
          />
        )}
        <span className="text-xs text-white/60">
          {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Tap to speak"}
        </span>
      </div>
    </div>
  );
}

export default VoiceWaveform;

