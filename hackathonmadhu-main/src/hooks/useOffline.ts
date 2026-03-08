"use client";

import { useState, useEffect, useCallback } from "react";

// IndexedDB configuration
const DB_NAME = "kisan-os-offline";
const DB_VERSION = 1;

interface DBSchema {
  marketPrices: {
    key: string;
    crop: string;
    prices: any[];
    timestamp: number;
  };
  advisoryCache: {
    key: string;
    query: string;
    response: string;
    timestamp: number;
  };
  pendingRequests: {
    id: string;
    type: "advisory" | "transport" | "disease";
    payload: any;
    timestamp: number;
    retries: number;
  };
  userData: {
    key: string;
    data: any;
    timestamp: number;
  };
}

// Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not supported"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      if (!db.objectStoreNames.contains("marketPrices")) {
        db.createObjectStore("marketPrices", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("advisoryCache")) {
        db.createObjectStore("advisoryCache", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("pendingRequests")) {
        db.createObjectStore("pendingRequests", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("userData")) {
        db.createObjectStore("userData", { keyPath: "key" });
      }
    };
  });
}

// Generic DB operations
async function dbPut<T>(storeName: string, data: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function dbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function dbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function dbDelete(storeName: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Hook for managing offline state
export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync when back online
      syncPendingRequests();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync pending requests when back online
  const syncPendingRequests = useCallback(async () => {
    if (!navigator.onLine) return;
    
    setIsSyncing(true);
    try {
      const pendingRequests = await dbGetAll<DBSchema["pendingRequests"]>("pendingRequests");
      
      for (const request of pendingRequests) {
        try {
          await processPendingRequest(request);
          await dbDelete("pendingRequests", request.id);
        } catch (error) {
          console.error("Failed to sync request:", error);
          // Increment retry count
          if (request.retries < 3) {
            await dbPut("pendingRequests", {
              ...request,
              retries: request.retries + 1,
            });
          }
        }
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isOnline,
    isSyncing,
    syncPendingRequests,
  };
}

// Process a pending request
async function processPendingRequest(request: DBSchema["pendingRequests"]): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const token = localStorage.getItem("access_token");

  let endpoint = "";
  let method = "POST";

  switch (request.type) {
    case "advisory":
      endpoint = "/api/advisory/query";
      break;
    case "transport":
      endpoint = "/api/logistics/request";
      break;
    case "disease":
      endpoint = "/api/ai/disease-detect";
      break;
  }

  await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(request.payload),
  });
}

// Hook for caching market prices
export function useMarketCache() {
  const cachePrices = useCallback(async (crop: string, prices: any[]) => {
    const key = `market_${crop.toLowerCase()}`;
    await dbPut<DBSchema["marketPrices"]>("marketPrices", {
      key,
      crop,
      prices,
      timestamp: Date.now(),
    });
  }, []);

  const getCachedPrices = useCallback(async (crop: string): Promise<any[] | null> => {
    const key = `market_${crop.toLowerCase()}`;
    const cached = await dbGet<DBSchema["marketPrices"]>("marketPrices", key);
    
    if (!cached) return null;
    
    // Cache expires after 1 hour
    const isExpired = Date.now() - cached.timestamp > 60 * 60 * 1000;
    if (isExpired) return null;
    
    return cached.prices;
  }, []);

  const getCachedPricesSync = useCallback((crop: string): any[] | null => {
    // Synchronous check (returns cached data if available)
    // This is a simplified version - in production you'd use a more sophisticated approach
    return null; // For now, return null to always fetch fresh data
  }, []);

  return {
    cachePrices,
    getCachedPrices,
    getCachedPricesSync,
  };
}

// Hook for caching advisory responses
export function useAdvisoryCache() {
  const cacheResponse = useCallback(async (query: string, response: string) => {
    const key = `advisory_${query.toLowerCase().substring(0, 50)}`;
    await dbPut<DBSchema["advisoryCache"]>("advisoryCache", {
      key,
      query,
      response,
      timestamp: Date.now(),
    });
  }, []);

  const getCachedResponse = useCallback(async (query: string): Promise<string | null> => {
    const key = `advisory_${query.toLowerCase().substring(0, 50)}`;
    const cached = await dbGet<DBSchema["advisoryCache"]>("advisoryCache", key);
    
    if (!cached) return null;
    
    // Cache expires after 24 hours
    const isExpired = Date.now() - cached.timestamp > 24 * 60 * 60 * 1000;
    if (isExpired) return null;
    
    return cached.response;
  }, []);

  return {
    cacheResponse,
    getCachedResponse,
  };
}

// Hook for queuing requests when offline
export function useRequestQueue() {
  const queueRequest = useCallback(async (
    type: "advisory" | "transport" | "disease",
    payload: any
  ): Promise<string> => {
    const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await dbPut<DBSchema["pendingRequests"]>("pendingRequests", {
      id,
      type,
      payload,
      timestamp: Date.now(),
      retries: 0,
    });

    return id;
  }, []);

  const getPendingCount = useCallback(async (): Promise<number> => {
    const pending = await dbGetAll<DBSchema["pendingRequests"]>("pendingRequests");
    return pending.length;
  }, []);

  const clearPendingRequests = useCallback(async () => {
    const pending = await dbGetAll<DBSchema["pendingRequests"]>("pendingRequests");
    for (const request of pending) {
      await dbDelete("pendingRequests", request.id);
    }
  }, []);

  return {
    queueRequest,
    getPendingCount,
    clearPendingRequests,
  };
}

// Hook for user data persistence
export function useUserData() {
  const saveUserData = useCallback(async (key: string, data: any) => {
    await dbPut<DBSchema["userData"]>("userData", {
      key,
      data,
      timestamp: Date.now(),
    });
  }, []);

  const getUserData = useCallback(async <T>(key: string): Promise<T | null> => {
    const cached = await dbGet<DBSchema["userData"]>("userData", key);
    return cached?.data || null;
  }, []);

  return {
    saveUserData,
    getUserData,
  };
}

// Combined offline hook
export function useOfflineStorage() {
  const offline = useOffline();
  const marketCache = useMarketCache();
  const advisoryCache = useAdvisoryCache();
  const requestQueue = useRequestQueue();
  const userData = useUserData();

  return {
    ...offline,
    ...marketCache,
    ...advisoryCache,
    ...requestQueue,
    ...userData,
  };
}

export default useOfflineStorage;

