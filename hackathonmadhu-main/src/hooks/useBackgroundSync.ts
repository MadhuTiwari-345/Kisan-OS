"use client";

import { useState, useEffect, useCallback } from "react";

interface PendingRequest {
  id: string;
  type: "advisory" | "transport" | "market" | "disease";
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

interface UseBackgroundSyncReturn {
  isSupported: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  syncNow: () => Promise<void>;
  queueRequest: (type: PendingRequest["type"], payload: Record<string, unknown>) => Promise<void>;
  clearQueue: () => Promise<void>;
}

const DB_NAME = "kisan-os-sync";
const STORE_NAME = "pendingRequests";

export function useBackgroundSync(): UseBackgroundSyncReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Check support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSupported("serviceWorker" in navigator && "sync" in ServiceWorkerRegistration.prototype);
    }
  }, []);

  // Open IndexedDB
  const openDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        reject(new Error("IndexedDB not supported"));
        return;
      }

      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
    });
  }, []);

  // Get pending requests count
  const getPendingCount = useCallback(async (): Promise<number> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return 0;
    }
  }, [openDB]);

  // Update pending count on mount and periodically
  useEffect(() => {
    const updateCount = async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    };

    updateCount();
    const interval = setInterval(updateCount, 30000);

    return () => clearInterval(interval);
  }, [getPendingCount]);

  // Queue a background sync
  const queueRequest = useCallback(async (
    type: PendingRequest["type"],
    payload: Record<string, unknown>
  ): Promise<void> => {
    const db = await openDB();
    const request: PendingRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const addRequest = store.add(request);
      
      addRequest.onsuccess = async () => {
        setPendingCount(prev => prev + 1);
        
        // Try to register background sync if supported
        if (isSupported && navigator.serviceWorker) {
          try {
            const registration = await navigator.serviceWorker.ready;
            await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register("sync-requests");
          } catch (syncError) {
            console.log("Background sync registration failed:", syncError);
          }
        }
        
        resolve();
      };
      
      addRequest.onerror = () => reject(addRequest.error);
    });
  }, [openDB, isSupported]);

  // Process a single request
  const processRequest = useCallback(async (requestData: PendingRequest): Promise<boolean> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    let endpoint = "";
    const method = "POST";

    switch (requestData.type) {
      case "advisory":
        endpoint = "/api/advisory/query";
        break;
      case "transport":
        endpoint = "/api/logistics/request";
        break;
      case "market":
        endpoint = "/api/market/prices";
        break;
      case "disease":
        endpoint = "/api/advisory/detect-disease";
        break;
    }

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(requestData.payload),
      });

      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // Sync all pending requests
  const syncNow = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;

    setIsSyncing(true);
    try {
      const db = await openDB();
      const requests = await new Promise<PendingRequest[]>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      for (const req of requests) {
        const success = await processRequest(req);
        
        if (success) {
          // Remove successful request
          const deleteTransaction = db.transaction(STORE_NAME, "readwrite");
          const deleteStore = deleteTransaction.objectStore(STORE_NAME);
          deleteStore.delete(req.id);
        } else if (req.retries >= 3) {
          // Remove failed request after 3 retries
          const deleteTransaction = db.transaction(STORE_NAME, "readwrite");
          const deleteStore = deleteTransaction.objectStore(STORE_NAME);
          deleteStore.delete(req.id);
        } else {
          // Increment retry count
          const updateTransaction = db.transaction(STORE_NAME, "readwrite");
          const updateStore = updateTransaction.objectStore(STORE_NAME);
          updateStore.put({ ...req, retries: req.retries + 1 });
        }
      }

      setLastSyncTime(Date.now());
      const count = await getPendingCount();
      setPendingCount(count);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, openDB, processRequest, getPendingCount]);

  // Clear all pending requests
  const clearQueue = useCallback(async () => {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    setPendingCount(0);
  }, [openDB]);

  // Listen for online event to trigger sync
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      syncNow();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncNow]);

  return {
    isSupported,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncNow,
    queueRequest,
    clearQueue,
  };
}

export default useBackgroundSync;

