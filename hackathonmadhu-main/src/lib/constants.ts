export const siteConfig = {
  name: "KISAN-OS",
  description:
    "Voice-powered intelligence for every farmer. Connects farmers to market prices, logistics, and real-time advisory in their own language.",
  url: "https://kisan-os.in",
  github: "https://github.com/kisan-os",
} as const;

export const navLinks = [
  { label: "Product", href: "#product" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Technology", href: "#technology" },
  { label: "Impact", href: "#impact" },
  { label: "Contact", href: "#contact" },
] as const;

export const languages = [
  "English",
  "Hindi",
  "Bengali",
  "Telugu",
  "Marathi",
  "Tamil",
  "Urdu",
  "Gujarati",
  "Kannada",
  "Odia",
  "Malayalam",
  "Punjabi",
  "Assamese",
  "Maithili",
  "Santali",
  "Kashmiri",
  "Nepali",
  "Sindhi",
  "Dogri",
  "Konkani",
  "Manipuri",
  "Bodo",
  "Sanskrit",
] as const;

export const cropData: Record<
  string,
  { marketA: number; marketB: number; unit: string; suggestion: string }
> = {
  wheat: {
    marketA: 2280,
    marketB: 2410,
    unit: "per quintal",
    suggestion: "Sell at Market B (Azadpur Mandi) - Rs 130/q higher. Best window: next 3 days.",
  },
  rice: {
    marketA: 3150,
    marketB: 2980,
    unit: "per quintal",
    suggestion: "Sell at Market A (Karnal Mandi) - Rs 170/q higher. Demand rising this week.",
  },
  tomato: {
    marketA: 1850,
    marketB: 2200,
    unit: "per quintal",
    suggestion: "Sell at Market B (Vashi Mandi) - Rs 350/q higher. Price trend is upward.",
  },
  onion: {
    marketA: 1420,
    marketB: 1280,
    unit: "per quintal",
    suggestion: "Sell at Market A (Lasalgaon) - Rs 140/q higher. Hold if possible - prices rising.",
  },
  potato: {
    marketA: 980,
    marketB: 1120,
    unit: "per quintal",
    suggestion: "Sell at Market B (Agra Mandi) - Rs 140/q higher. Cold storage rates increasing.",
  },
  sugarcane: {
    marketA: 3500,
    marketB: 3450,
    unit: "per quintal",
    suggestion: "Both markets are similar. Sell at Market A - closer and saves about Rs 200 in transport.",
  },
  cotton: {
    marketA: 6800,
    marketB: 7100,
    unit: "per quintal",
    suggestion: "Sell at Market B (Rajkot Mandi) - Rs 300/q higher. Export demand is strong.",
  },
  soybean: {
    marketA: 4600,
    marketB: 4350,
    unit: "per quintal",
    suggestion: "Sell at Market A (Indore Mandi) - Rs 250/q higher. Crushing season demand is high.",
  },
  mustard: {
    marketA: 5200,
    marketB: 5450,
    unit: "per quintal",
    suggestion: "Sell at Market B (Jaipur Mandi) - Rs 250/q premium. Oil mills are stocking up.",
  },
  maize: {
    marketA: 1950,
    marketB: 2080,
    unit: "per quintal",
    suggestion: "Sell at Market B (Davangere Mandi) - Rs 130/q higher. Poultry feed demand is rising.",
  },
};

export const marketNames: Record<string, { a: string; b: string }> = {
  wheat: { a: "Khanna Mandi", b: "Azadpur Mandi" },
  rice: { a: "Karnal Mandi", b: "Cuttack Mandi" },
  tomato: { a: "Kolar Mandi", b: "Vashi Mandi" },
  onion: { a: "Lasalgaon", b: "Nashik Mandi" },
  potato: { a: "Farrukhabad Mandi", b: "Agra Mandi" },
  sugarcane: { a: "Muzaffarnagar", b: "Lakhimpur Mandi" },
  cotton: { a: "Guntur Mandi", b: "Rajkot Mandi" },
  soybean: { a: "Indore Mandi", b: "Ujjain Mandi" },
  mustard: { a: "Alwar Mandi", b: "Jaipur Mandi" },
  maize: { a: "Gulbarga Mandi", b: "Davangere Mandi" },
};
