"use client";

import { useState, useCallback } from "react";

interface FarmerLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  quantityKg: number;
  cropType: string;
}

interface MilkRunStop {
  stop: number;
  type: "pickup" | "destination";
  farmerId?: string;
  farmerName?: string;
  latitude: number;
  longitude: number;
  quantityKg: number;
  distanceFromPrevKm: number;
  cumulativeDistanceKm: number;
  estimatedTimeMinutes: number;
}

interface MilkRunResult {
  poolId: string;
  cropType: string;
  destinationMandi: string;
  totalQuantityKg: number;
  farmersCount: number;
  totalDistanceKm: number;
  totalTimeMinutes: number;
  estimatedCost: number;
  costPerKg: number;
  costPerFarmer: number;
  savingsPercentage: number;
  carbonSavedKg: number;
  optimizedRoute: MilkRunStop[];
}

interface MilkRunState {
  state: "idle" | "adding" | "optimizing" | "ready";
  farmers: FarmerLocation[];
  route: MilkRunStop[];
  savings: number;
}

interface UseMilkRunReturn {
  isOptimizing: boolean;
  result: MilkRunResult | null;
  error: string | null;
  state: MilkRunState["state"];
  farmers: FarmerLocation[];
  route: MilkRunStop[];
  savings: number;
  addFarmer: (farmer: FarmerLocation) => void;
  removeFarmer: (id: string) => void;
  setDestination: (mandi: string) => void;
  optimizeRoute: (
    farmers: FarmerLocation[],
    destinationMandi: string,
    vehicleCapacityKg: number,
    cropType: string
  ) => Promise<MilkRunResult | null>;
  calculateCost: (distanceKm: number, quantityKg: number) => number;
  reset: () => void;
}

const BASE_COST_PER_KM = 12;
const FUEL_COST_PER_KM = 8;
const LOADING_UNLOADING_PER_Q = 50;
const AVERAGE_SPEED_KMPH = 40;

function generateId(): string {
  return `farmer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getMandiCoordinates(mandi: string): { lat: number; lng: number; state: string } {
  const mandis: Record<string, { lat: number; lng: number; state: string }> = {
    "Azadpur Mandi": { lat: 28.6518, lng: 77.1655, state: "Delhi" },
    "Vashi Mandi": { lat: 19.0760, lng: 73.0087, state: "Maharashtra" },
    "Lasalgaon": { lat: 20.9524, lng: 73.8215, state: "Maharashtra" },
    "Indore Mandi": { lat: 22.7196, lng: 75.8577, state: "Madhya Pradesh" },
    "Karnal Mandi": { lat: 29.6917, lng: 76.9885, state: "Haryana" },
    "Rajkot Mandi": { lat: 22.3039, lng: 70.8022, state: "Gujarat" },
  };
  return mandis[mandi] || { lat: 28.6518, lng: 77.1655, state: "Delhi" };
}

export function useMilkRun(): UseMilkRunReturn {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<MilkRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [milkRunState, setMilkRunState] = useState<MilkRunState["state"]>("idle");
  const [farmers, setFarmers] = useState<FarmerLocation[]>([]);
  const [route, setRoute] = useState<MilkRunStop[]>([]);
  const [savings, setSavings] = useState(0);
  const [destination, setDestinationState] = useState<string>("");

  const calculateCost = useCallback((distanceKm: number, quantityKg: number): number => {
    const distanceCost = distanceKm * BASE_COST_PER_KM;
    const loadingCost = (quantityKg / 100) * LOADING_UNLOADING_PER_Q;
    const fuelSurcharge = distanceKm * FUEL_COST_PER_KM;
    return Math.round(distanceCost + loadingCost + fuelSurcharge);
  }, []);

  const addFarmer = useCallback((farmer: FarmerLocation) => {
    const newFarmer = farmer.id ? farmer : { ...farmer, id: generateId() };
    setFarmers(prev => [...prev, newFarmer]);
    setMilkRunState("adding");
  }, []);

  const removeFarmer = useCallback((id: string) => {
    setFarmers(prev => prev.filter(f => f.id !== id));
  }, []);

  const setDestination = useCallback((mandi: string) => {
    setDestinationState(mandi);
  }, []);

  const optimizeRoute = useCallback(async (
    farmersInput: FarmerLocation[],
    destinationMandi: string,
    vehicleCapacityKg: number,
    cropType: string
  ): Promise<MilkRunResult | null> => {
    const farmersToUse = farmersInput.length > 0 ? farmersInput : farmers;

    if (farmersToUse.length === 0) {
      setError("No farmers to optimize");
      return null;
    }

    setIsOptimizing(true);
    setMilkRunState("optimizing");
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const destCoords = getMandiCoordinates(destinationMandi);
      const totalQuantity = farmersToUse.reduce((sum, f) => sum + f.quantityKg, 0);

      const startLat = farmersToUse[0]?.latitude || 28.7;
      const startLng = farmersToUse[0]?.longitude || 77.1;

      const sortedFarmers = [...farmersToUse].sort((a, b) => {
        const distA = haversineDistance(startLat, startLng, a.latitude, a.longitude);
        const distB = haversineDistance(startLat, startLng, b.latitude, b.longitude);
        return distA - distB;
      });

      const optimizedRoute: MilkRunStop[] = [];
      let cumulativeDistance = 0;
      let prevLat = startLat;
      let prevLng = startLng;

      sortedFarmers.forEach((farmer, idx) => {
        const distFromPrev = haversineDistance(prevLat, prevLng, farmer.latitude, farmer.longitude);
        cumulativeDistance += distFromPrev;

        optimizedRoute.push({
          stop: idx + 1,
          type: "pickup",
          farmerId: farmer.id,
          farmerName: farmer.name,
          latitude: farmer.latitude,
          longitude: farmer.longitude,
          quantityKg: farmer.quantityKg,
          distanceFromPrevKm: Math.round(distFromPrev * 10) / 10,
          cumulativeDistanceKm: Math.round(cumulativeDistance * 10) / 10,
          estimatedTimeMinutes: Math.round((distFromPrev / AVERAGE_SPEED_KMPH) * 60)
        });

        prevLat = farmer.latitude;
        prevLng = farmer.longitude;
      });

      const distToDest = haversineDistance(prevLat, prevLng, destCoords.lat, destCoords.lng);
      cumulativeDistance += distToDest;

      optimizedRoute.push({
        stop: optimizedRoute.length + 1,
        type: "destination",
        latitude: destCoords.lat,
        longitude: destCoords.lng,
        quantityKg: 0,
        distanceFromPrevKm: Math.round(distToDest * 10) / 10,
        cumulativeDistanceKm: Math.round(cumulativeDistance * 10) / 10,
        estimatedTimeMinutes: Math.round((distToDest / AVERAGE_SPEED_KMPH) * 60)
      });

      const totalCost = calculateCost(cumulativeDistance, totalQuantity);
      const individualCost = totalCost * 1.6;
      const savingsPercent = Math.round(((individualCost - totalCost) / individualCost) * 100);

      const milkRunResult: MilkRunResult = {
        poolId: `POOL-${Date.now()}`,
        cropType,
        destinationMandi,
        totalQuantityKg: totalQuantity,
        farmersCount: sortedFarmers.length,
        totalDistanceKm: Math.round(cumulativeDistance * 10) / 10,
        totalTimeMinutes: Math.round((cumulativeDistance / AVERAGE_SPEED_KMPH) * 60),
        estimatedCost: totalCost,
        costPerKg: Math.round((totalCost / (totalQuantity / 100)) * 100) / 100,
        costPerFarmer: Math.round(totalCost / sortedFarmers.length),
        savingsPercentage: savingsPercent,
        carbonSavedKg: Math.round((cumulativeDistance * 0.3) * 10) / 10,
        optimizedRoute
      };

      setResult(milkRunResult);
      setRoute(optimizedRoute);
      setSavings(savingsPercent);
      setMilkRunState("ready");

      return milkRunResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Optimization failed";
      setError(errorMessage);
      return null;
    } finally {
      setIsOptimizing(false);
    }
  }, [farmers, calculateCost]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setMilkRunState("idle");
    setFarmers([]);
    setRoute([]);
    setSavings(0);
  }, []);

  return {
    isOptimizing,
    result,
    error,
    state: milkRunState,
    farmers,
    route,
    savings,
    addFarmer,
    removeFarmer,
    setDestination,
    optimizeRoute,
    calculateCost,
    reset
  };
}

export type { MilkRunState, FarmerLocation, MilkRunStop, MilkRunResult };
export default useMilkRun;
