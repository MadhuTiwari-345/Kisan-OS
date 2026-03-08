"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface GeoPosition {
  latitude: number;
  longitude: number;
  lat?: number;
  lng?: number;
  accuracy?: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface GeoAddress {
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
  country?: string;
  formatted?: string;
}

interface UseGeoLocationReturn {
  position: GeoPosition | null;
  address: GeoAddress | null;
  error: string | null;
  isLoading: boolean;
  isSupported: boolean;
  permissionStatus: "granted" | "denied" | "prompt" | "unknown";
  // Additional properties expected by logistics page
  location: GeoPosition | null;
  refreshLocation: () => Promise<GeoPosition | null>;
  getCurrentPosition: (enableHighAccuracy?: boolean) => Promise<GeoPosition | null>;
  watchPosition: (enableHighAccuracy?: boolean) => void;
  clearWatch: () => void;
  reverseGeocode: (lat: number, lng: number) => Promise<GeoAddress | null>;
}

export function useGeoLocation(): UseGeoLocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [address, setAddress] = useState<GeoAddress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown");
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setIsSupported(true);
      if ("permissions" in navigator) {
        navigator.permissions.query({ name: "geolocation" } as PermissionDescriptor)
          .then((result) => {
            setPermissionStatus(result.state as "granted" | "denied" | "prompt");
          })
          .catch(() => {
            setPermissionStatus("unknown");
          });
      }
    }
  }, []);

  const reverseGeocode = useCallback(async (
    lat: number,
    lng: number
  ): Promise<GeoAddress | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "User-Agent": "Kisan-OS/1.0" } }
      );

      if (!response.ok) return null;

      const data = await response.json();
      const geoAddress: GeoAddress = {
        village: data.address.village || data.address.town || data.address.city || data.address.county,
        district: data.address.county,
        state: data.address.state,
        pincode: data.address.postcode,
        country: data.address.country,
        formatted: data.display_name,
      };
      setAddress(geoAddress);
      return geoAddress;
    } catch {
      return null;
    }
  }, []);

  const getCurrentPosition = useCallback(async (
    enableHighAccuracy: boolean = true
  ): Promise<GeoPosition | null> => {
    if (!isSupported) {
      setError("Geolocation is not supported");
      return null;
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const geoPosition: GeoPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
          };
          setPosition(geoPosition);
          setIsLoading(false);
          reverseGeocode(geoPosition.latitude, geoPosition.longitude);
          resolve(geoPosition);
        },
        (err) => {
          let errorMessage = "Unable to get location";
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = "Location permission denied";
              setPermissionStatus("denied");
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case err.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          setError(errorMessage);
          setIsLoading(false);
          resolve(null);
        },
        { enableHighAccuracy, timeout: 10000, maximumAge: 300000 }
      );
    });
  }, [isSupported, reverseGeocode]);

  const refreshLocation = useCallback(async (): Promise<GeoPosition | null> => {
    return getCurrentPosition(true);
  }, [getCurrentPosition]);

  const watchPosition = useCallback((enableHighAccuracy: boolean = true) => {
    if (!isSupported || watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const geoPosition: GeoPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        };
        setPosition(geoPosition);
        if (geoPosition.accuracy && geoPosition.accuracy < 100) {
          reverseGeocode(geoPosition.latitude, geoPosition.longitude);
        }
      },
      (err) => console.error("Geolocation watch error:", err),
      { enableHighAccuracy, timeout: 10000, maximumAge: 60000 }
    );
  }, [isSupported, reverseGeocode]);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    position,
    address,
    error,
    isLoading,
    isSupported,
    permissionStatus,
    location: position,
    refreshLocation,
    getCurrentPosition,
    watchPosition,
    clearWatch,
    reverseGeocode,
  };
}

export default useGeoLocation;
