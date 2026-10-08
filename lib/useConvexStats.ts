"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth, useUserIdentifier } from "./useAuth";
import { useEffect, useCallback, useRef, useState } from "react";
import {
  addToOfflineQueue,
  getOfflineQueue,
  removeFromOfflineQueue,
  updateOfflineStats,
  recordOfflineSession,
  getOfflineStats,
  clearPendingOfflineSeconds,
  isOnline,
} from "./offlineQueue";

// Helper to get client's local date in YYYY-MM-DD format
function getClientDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useConvexStats() {
  const { user, isAuthenticated } = useAuth();
  const userIdentifier = useUserIdentifier();
  const pendingSecondsRef = useRef(0);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [online, setOnline] = useState(true);
  const syncingRef = useRef(false);

  // Keep clientDate fresh even if app stays open past midnight
  const [clientDate, setClientDate] = useState(getClientDate());
  useEffect(() => {
    const timer = setInterval(() => {
      const freshDate = getClientDate();
      if (freshDate !== clientDate) setClientDate(freshDate);
    }, 60000); // check every minute
    return () => clearInterval(timer);
  }, [clientDate]);

  // Get identifier params for queries
  const identifierParams = userIdentifier || { visitorId: undefined, email: undefined };

  // Queries - skip when offline
  const todayStats = useQuery(
    api.stats.getTodayStats,
    userIdentifier && online ? identifierParams : "skip"
  );

  const streak = useQuery(
    api.stats.getStreak,
    userIdentifier && online ? identifierParams : "skip"
  );

  const lifetimeTotals = useQuery(
    api.stats.getLifetimeTotals,
    userIdentifier && online ? identifierParams : "skip"
  );

  const statsRange = useQuery(
    api.stats.getStatsRange,
    userIdentifier && online ? { ...identifierParams, days: 30 } : "skip"
  );

  // Mutations
  const addElapsedTimeMutation = useMutation(api.stats.addElapsedTime);
  const recordSessionMutation = useMutation(api.stats.recordSession);

  // Sync offline queue when back online
  const syncOfflineQueue = useCallback(async () => {
    if (!userIdentifier || syncingRef.current) return;
    
    syncingRef.current = true;
    const queue = getOfflineQueue();
    
    for (const action of queue) {
      try {
        if (action.type === "addElapsedTime" && action.payload.seconds) {
          await addElapsedTimeMutation({
            ...userIdentifier,
            mode: action.payload.mode || "focus",
            seconds: action.payload.seconds,
            
          });
        } else if (action.type === "recordSession" && action.payload.durationMinutes) {
          await recordSessionMutation({
            ...userIdentifier,
            durationMinutes: action.payload.durationMinutes,
            mode: action.payload.mode || "focus",
            
          });
        }
        removeFromOfflineQueue(action.id);
      } catch (error) {
        console.error("Failed to sync offline action:", error);
        // Stop syncing on error, will retry later
        break;
      }
    }
    
    clearPendingOfflineSeconds();
    syncingRef.current = false;
  }, [userIdentifier, addElapsedTimeMutation, recordSessionMutation]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      // Sync queued data when back online
      syncOfflineQueue();
    };
    
    const handleOffline = () => {
      setOnline(false);
    };

    // Set initial state
    setOnline(isOnline());

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Try to sync any pending offline data on mount
    if (isOnline()) {
      syncOfflineQueue();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncOfflineQueue]);

  // Flush pending seconds to database
  const flushPendingSeconds = useCallback(
    async (mode: string) => {
      if (!userIdentifier || pendingSecondsRef.current <= 0) return;

      const seconds = pendingSecondsRef.current;
      const clientDate = getClientDate();
      pendingSecondsRef.current = 0;

      // If offline, queue the action
      if (!isOnline()) {
        addToOfflineQueue({
          type: "addElapsedTime",
          payload: { ...userIdentifier, mode, seconds },
        });
        updateOfflineStats(mode, seconds);
        return;
      }

      try {
        await addElapsedTimeMutation({ ...userIdentifier, mode, seconds });
      } catch (error) {
        console.error("Failed to sync elapsed time:", error);
        // Queue for later if failed
        addToOfflineQueue({
          type: "addElapsedTime",
          payload: { ...userIdentifier, mode, seconds },
        });
        updateOfflineStats(mode, seconds);
      }
    },
    [userIdentifier, addElapsedTimeMutation]
  );

  // Add elapsed seconds (batched)
  const addElapsedSeconds = useCallback(
    (mode: string, seconds: number) => {
      if (!userIdentifier || seconds <= 0) return;

      pendingSecondsRef.current += seconds;
      
      // Always update offline stats for immediate UI feedback
      updateOfflineStats(mode, seconds);

      // Clear existing timeout
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }

      // Flush after 5 seconds of inactivity or when accumulated > 30 seconds
      if (pendingSecondsRef.current >= 30) {
        flushPendingSeconds(mode);
      } else {
        flushTimeoutRef.current = setTimeout(() => {
          flushPendingSeconds(mode);
        }, 5000);
      }
    },
    [userIdentifier, flushPendingSeconds]
  );

  // Record completed session
  const recordSession = useCallback(
    async (durationMinutes: number, mode: string = "focus") => {
      if (!userIdentifier) return;

      // Flush any pending seconds first
      await flushPendingSeconds(mode);

      const clientDate = getClientDate();

      // If offline, queue the action
      if (!isOnline()) {
        addToOfflineQueue({
          type: "recordSession",
          payload: { ...userIdentifier, durationMinutes, mode },
        });
        recordOfflineSession();
        return;
      }

      try {
        await recordSessionMutation({ ...userIdentifier, durationMinutes, mode });
      } catch (error) {
        console.error("Failed to record session:", error);
        // Queue for later if failed
        addToOfflineQueue({
          type: "recordSession",
          payload: { ...userIdentifier, durationMinutes, mode },
        });
        recordOfflineSession();
      }
    },
    [userIdentifier, recordSessionMutation, flushPendingSeconds]
  );

  // Cleanup on unmount - flush remaining seconds
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save any pending seconds to offline queue before page unload
      if (pendingSecondsRef.current > 0 && userIdentifier) {
        addToOfflineQueue({
          type: "addElapsedTime",
          payload: { ...userIdentifier, mode: "focus", seconds: pendingSecondsRef.current: getClientDate() },
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
    };
  }, [userIdentifier]);

  // Merge offline stats with server stats for display
  const offlineStats = getOfflineStats();
  const mergedTodayStats = todayStats || offlineStats?.todayStats || { 
    totalMinutes: 0, 
    sessions: 0, 
    focusSeconds: 0, 
    breakSeconds: 0 
  };

  return {
    user,
    isAuthenticated,
    isOnline: online,
    isLoading: !userIdentifier || (online && (todayStats === undefined || lifetimeTotals === undefined)),
    todayStats: mergedTodayStats,
    streak: streak || { currentStreak: 0, bestStreak: 0, lastActivityDate: "" },
    lifetimeTotals: lifetimeTotals || { focusMinutes: 0, focusHours: 0, totalSessions: 0 },
    statsRange: statsRange || [],
    addElapsedSeconds,
    recordSession,
    flushPendingSeconds,
    syncOfflineQueue,
  };
}
