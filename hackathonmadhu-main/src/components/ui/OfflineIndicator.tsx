"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OfflineIndicatorProps {
  pendingCount?: number;
  lastSyncTime?: number | null;
  onSync?: () => void;
}

export function OfflineIndicator({ pendingCount = 0, lastSyncTime, onSync }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 2000);
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const formatLastSync = (timestamp: number | null | undefined) => {
    if (!timestamp) return "Never";
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 backdrop-blur-lg border-b border-amber-400/30"
        >
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-amber-950" />
              <span className="text-sm font-medium text-amber-950">
                You&apos;re offline
              </span>
            </div>
            
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-800">
                <Clock className="h-3 w-3" />
                <span>{pendingCount} pending</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {isOnline && pendingCount > 0 && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-blue-500/90 backdrop-blur-lg border-b border-blue-400/30"
        >
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 text-white ${isSyncing ? "animate-spin" : ""}`} />
              <span className="text-sm font-medium text-white">
                {isSyncing ? "Syncing..." : "Syncing pending data"}
              </span>
            </div>
            
            <button
              onClick={onSync}
              className="flex items-center gap-1 text-xs text-white/80 hover:text-white"
            >
              <span>Last: {formatLastSync(lastSyncTime)}</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OfflineIndicator;

