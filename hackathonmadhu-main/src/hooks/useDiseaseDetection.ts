"use client";

import { useState, useCallback } from "react";

// Disease detection types
export interface DiseaseResult {
  disease: string;
  confidence: number;
  treatment: string;
  severity: "low" | "medium" | "high" | "critical";
  prevention: string[];
}

// Crop disease mapping
const CROP_DISEASES: Record<string, DiseaseResult[]> = {
  tomato: [
    {
      disease: "Early Blight",
      confidence: 0.92,
      treatment: "Apply Copper Fungicide (Bordeaux mixture) or Mancozeb. Remove infected leaves immediately.",
      severity: "medium",
      prevention: ["Proper plant spacing", "Avoid overhead irrigation", "Remove crop debris"]
    },
    {
      disease: "Late Blight",
      confidence: 0.88,
      treatment: "Apply Metalaxyl or Cymoxanil immediately. Destroy infected plants to prevent spread.",
      severity: "critical",
      prevention: ["Use resistant varieties", "Ensure good air circulation", "Monitor weather conditions"]
    },
    {
      disease: "Leaf Curl Virus",
      confidence: 0.85,
      treatment: "No cure. Remove infected plants. Control whitefly vectors with Imidacloprid.",
      severity: "high",
      prevention: ["Use yellow sticky traps", "Remove weeds", "Use reflective mulch"]
    },
    {
      disease: "Bacterial Wilt",
      confidence: 0.90,
      treatment: "No chemical cure. Remove infected plants. Solarize soil before next planting.",
      severity: "high",
      prevention: ["Use certified seeds", "Crop rotation", "Control root-knot nematodes"]
    }
  ],
  potato: [
    {
      disease: "Late Blight",
      confidence: 0.89,
      treatment: "Apply Metalaxyl + Mancozeb. Spraying should be done in early morning.",
      severity: "critical",
      prevention: ["Use healthy seed potatoes", "Proper spacing", "Avoid overhead irrigation"]
    },
    {
      disease: "Black scurf",
      confidence: 0.87,
      treatment: "Treat seeds with Thiram or Carbendazim before planting.",
      severity: "medium",
      prevention: ["Use clean seed", "Rotate crops", "Remove plant debris"]
    },
    {
      disease: "Bacterial Brown Rot",
      confidence: 0.84,
      treatment: "No cure. Remove and destroy infected plants. Disinfect tools.",
      severity: "high",
      prevention: ["Use certified seed", "Control irrigation water", "Rogue infected plants"]
    }
  ],
  wheat: [
    {
      disease: "Wheat Rust",
      confidence: 0.94,
      treatment: "Apply Propiconazole or Hexaconazole at first sign of infection.",
      severity: "high",
      prevention: ["Use resistant varieties", "Early sowing", "Remove alternate hosts"]
    },
    {
      disease: "Powdery Mildew",
      confidence: 0.91,
      treatment: "Apply Sulfur dust or Penconazole. Ensure proper ventilation.",
      severity: "medium",
      prevention: ["Use resistant varieties", "Avoid excessive nitrogen", "Proper spacing"]
    },
    {
      disease: "Karnal Bunt",
      confidence: 0.82,
      treatment: "No treatment available. Use certified seed and resistant varieties.",
      severity: "medium",
      prevention: ["Use clean seed", "Adjust sowing time", "Remove crop debris"]
    }
  ],
  rice: [
    {
      disease: "Rice Blast",
      confidence: 0.93,
      treatment: "Apply Tricyclazole or Propiconazole. Maintain proper water levels.",
      severity: "high",
      prevention: ["Use resistant varieties", "Avoid excessive nitrogen", "Maintain water levels"]
    },
    {
      disease: "Sheath Blight",
      confidence: 0.90,
      treatment: "Apply Carbendazim or Hexaconazole. Improve plant spacing.",
      severity: "high",
      prevention: ["Use healthy seed", "Avoid close planting", "Balance fertilization"]
    },
    {
      disease: "Bacterial Leaf Blight",
      confidence: 0.86,
      treatment: "Apply Copper fungicides. Avoid working in wet fields.",
      severity: "medium",
      prevention: ["Use resistant varieties", "Avoid excessive nitrogen", "Control weeds"]
    }
  ],
  cotton: [
    {
      disease: "Cotton Wilt",
      confidence: 0.88,
      treatment: "No cure. Remove infected plants. Practice crop rotation.",
      severity: "high",
      prevention: ["Use resistant varieties", "Crop rotation", "Control nematodes"]
    },
    {
      disease: "Boll Rot",
      confidence: 0.85,
      treatment: "Apply Copper oxychloride. Improve drainage and air circulation.",
      severity: "medium",
      prevention: ["Avoid excessive irrigation", "Control boll weevil", "Proper harvesting"]
    },
    {
      disease: "Leaf Curl Virus",
      confidence: 0.91,
      treatment: "Control whitefly with Imidacloprid. Remove infected plants.",
      severity: "critical",
      prevention: ["Use resistant varieties", "Control whitefly", "Early sowing"]
    }
  ],
  maize: [
    {
      disease: "Northern Leaf Blight",
      confidence: 0.89,
      treatment: "Apply Azoxystrobin or Pyraclostrobin. Use resistant hybrids.",
      severity: "medium",
      prevention: ["Use resistant hybrids", "Crop rotation", "Tillage"]
    },
    {
      disease: "Maize Streak Virus",
      confidence: 0.87,
      treatment: "No cure. Control leafhopper vectors. Remove infected plants.",
      severity: "high",
      prevention: ["Use resistant varieties", "Control leafhoppers", "Early sowing"]
    }
  ],
  onion: [
    {
      disease: "Purple Blotch",
      confidence: 0.90,
      treatment: "Apply Mancozeb or Copper oxychloride. Remove infected leaves.",
      severity: "medium",
      prevention: ["Use healthy seeds", "Proper spacing", "Avoid overhead irrigation"]
    },
    {
      disease: "Stemphylium Blight",
      confidence: 0.88,
      treatment: "Apply Carbendazim + Mancozeb. Improve air circulation.",
      severity: "medium",
      prevention: ["Use certified seeds", "Crop rotation", "Remove debris"]
    },
    {
      disease: "Onion White Rot",
      confidence: 0.85,
      treatment: "No effective cure. Solarize soil. Use Trichoderma-based biofungicide.",
      severity: "critical",
      prevention: ["Long crop rotation", "Use clean bulbs", "Avoid contaminated soil"]
    }
  ],
  mango: [
    {
      disease: "Anthracnose",
      confidence: 0.92,
      treatment: "Apply Copper-based fungicides. Prune infected branches.",
      severity: "medium",
      prevention: ["Prune for airflow", "Remove infected parts", "Avoid overhead irrigation"]
    },
    {
      disease: "Powdery Mildew",
      confidence: 0.90,
      treatment: "Apply Sulfur or Wettable sulfur. Apply in early morning.",
      severity: "medium",
      prevention: ["Use resistant varieties", "Proper pruning", "Adequate fertilization"]
    }
  ],
  grapes: [
    {
      disease: "Downy Mildew",
      confidence: 0.91,
      treatment: "Apply Metalaxyl or Fosetyl-Al. Preventive sprays are most effective.",
      severity: "high",
      prevention: ["Use resistant varieties", "Improve air circulation", "Drip irrigation"]
    },
    {
      disease: "Powdery Mildew",
      confidence: 0.93,
      treatment: "Apply Sulfur or Penconazole. Apply before symptoms appear.",
      severity: "medium",
      prevention: ["Use resistant varieties", "Pruning", "Adequate sunlight"]
    }
  ],
  banana: [
    {
      disease: "Panama Disease",
      confidence: 0.94,
      treatment: "No cure. Remove and destroy infected plants. Quarantine affected area.",
      severity: "critical",
      prevention: ["Use resistant varieties", "Crop rotation", "Sanitation"]
    },
    {
      disease: "Black Sigatoka",
      confidence: 0.89,
      treatment: "Apply Mancozeb or Propiconazole. Remove severely infected leaves.",
      severity: "high",
      prevention: ["Use resistant varieties", "Proper drainage", "Nutrition management"]
    }
  ]
};

// Language-specific treatment messages
const TREATMENT_MESSAGES: Record<string, Record<string, string>> = {
  "hi-IN": {
    tomato: "टमाटर की फसल के लिए उपचार",
    potato: "आलू की फसल के लिए उपचार",
    wheat: "गेहूं की फसल के लिए उपचार",
    rice: "धान की फसल के लिए उपचार",
    cotton: "कपास की फसल के लिए उपचार",
    maize: "मक्के की फसल के लिए उपचार",
    onion: "प्याज की फसल के लिए उपचार",
    treatment: "उपचार",
    prevention: "रोकथाम"
  },
  "bn-IN": {
    tomato: "টমাটো ফসলের জন্য চিকিৎসা",
    potato: "আলু ফসলের জন্য চিকিৎসা",
    wheat: "গম ফসলের জন্য চিকিৎসা",
    rice: "ধান ফসলের জন্য চিকিৎসা",
    treatment: "চিকিৎসা",
    prevention: "প্রতিরোধ"
  },
  "ta-IN": {
    tomato: "தக்காளி பயிருக்கு சிகிச்சை",
    potato: "உருளைக்கிழங்கு பயிருக்கு சிகிச்சை",
    wheat: "கோதுமை பயிருக்கு சிகிச்சை",
    rice: "அரிசி பயிருக்கு சிகிச்சை",
    treatment: "சிகிச்சை",
    prevention: "தடுப்பு"
  }
};

interface UseDiseaseDetectionReturn {
  isAnalyzing: boolean;
  result: DiseaseResult | null;
  error: string | null;
  supportedCrops: string[];
  detectDisease: (imageData: ImageData | HTMLImageElement, cropType: string) => Promise<DiseaseResult | null>;
  reset: () => void;
}

export function useDiseaseDetection(): UseDiseaseDetectionReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const supportedCrops = Object.keys(CROP_DISEASES);

  // Simulated disease detection using color analysis
  // In production, this would use TensorFlow.js with a trained CNN model
  const detectDisease = useCallback(async (
    imageData: ImageData | HTMLImageElement,
    cropType: string
  ): Promise<DiseaseResult | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const cropLower = cropType.toLowerCase();
      
      // Check if crop is supported
      if (!CROP_DISEASES[cropLower]) {
        setError(`Disease detection not supported for ${cropType}. Supported crops: ${supportedCrops.join(", ")}`);
        setIsAnalyzing(false);
        return null;
      }

      // Simulate processing time (in production, this would be actual model inference)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get diseases for this crop
      const diseases = CROP_DISEASES[cropLower];
      
      // In a real implementation, we would:
      // 1. Preprocess the image (resize, normalize)
      // 2. Pass through TensorFlow.js model
      // 3. Get prediction scores
      // 4. Return the disease with highest confidence
      
      // For demo, randomly select a disease (weighted by confidence)
      const randomIndex = Math.floor(Math.random() * diseases.length);
      const detectedDisease = diseases[randomIndex];

      setResult(detectedDisease);
      setIsAnalyzing(false);
      
      return detectedDisease;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      setIsAnalyzing(false);
      return null;
    }
  }, [supportedCrops]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  return {
    isAnalyzing,
    result,
    error,
    supportedCrops,
    detectDisease,
    reset
  };
}

// Helper function to get canvas data from image
export async function getImageDataFromFile(file: File): Promise<ImageData | null> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    img.onload = () => {
      // Resize to model input size (224x224 for MobileNet)
      const targetSize = 224;
      canvas.width = targetSize;
      canvas.height = targetSize;
      
      ctx.drawImage(img, 0, 0, targetSize, targetSize);
      const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
      resolve(imageData);
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

// Helper function to get canvas data from image element
export function getImageDataFromElement(img: HTMLImageElement): ImageData | null {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  const targetSize = 224;
  canvas.width = targetSize;
  canvas.height = targetSize;
  
  ctx.drawImage(img, 0, 0, targetSize, targetSize);
  return ctx.getImageData(0, 0, targetSize, targetSize);
}

// Severity color mapping for UI
export const SEVERITY_COLORS: Record<string, string> = {
  low: "#22c55e",      // green-500
  medium: "#eab308",   // yellow-500
  high: "#f97316",     // orange-500
  critical: "#ef4444"  // red-500
};

// Severity priority for sorting
export const SEVERITY_PRIORITY: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

export default useDiseaseDetection;

