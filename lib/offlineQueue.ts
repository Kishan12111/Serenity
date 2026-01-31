"use client";

// Offline queue for syncing stats when back online
const OFFLINE_QUEUE_KEY = "serenity_offline_queue";
const OFFLINE_STATS_KEY = "serenity_offline_stats";

export interface QueuedAction {
  id: string;
  type: "addElapsedTime" | "recordSession";
  payload: {
    email?: string;
    visitorId?: string;
    mode?: string;
    seconds?: number;
    durationMinutes?: number;
  };
  timestamp: number;
}

export interface OfflineStats {
  todayStats: {
    date: string;
    totalMinutes: number;
    focusSeconds: number;
    breakSeconds: number;
    sessions: number;
  };
  pendingSeconds: number;
  pendingMode: string;
}

// Get queued actions
export function getOfflineQueue(): QueuedAction[] {
  if (typeof window === "undefined") return [];
  try {
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch {
    return [];
  }
}

// Add action to queue
export function addToOfflineQueue(action: Omit<QueuedAction, "id" | "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const queue = getOfflineQueue();
    const newAction: QueuedAction = {
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    queue.push(newAction);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to add to offline queue:", error);
  }
}

// Remove action from queue
export function removeFromOfflineQueue(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const queue = getOfflineQueue();
    const filtered = queue.filter((action) => action.id !== id);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove from offline queue:", error);
  }
}

// Clear entire queue
export function clearOfflineQueue(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

// Get offline stats cache
export function getOfflineStats(): OfflineStats | null {
  if (typeof window === "undefined") return null;
  try {
    const stats = localStorage.getItem(OFFLINE_STATS_KEY);
    return stats ? JSON.parse(stats) : null;
  } catch {
    return null;
  }
}

// Save offline stats cache
export function saveOfflineStats(stats: OfflineStats): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OFFLINE_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error("Failed to save offline stats:", error);
  }
}

// Update offline stats with elapsed time
export function updateOfflineStats(mode: string, seconds: number): void {
  if (typeof window === "undefined") return;
  
  const today = new Date().toISOString().split("T")[0];
  let stats = getOfflineStats();
  
  if (!stats || stats.todayStats.date !== today) {
    stats = {
      todayStats: {
        date: today,
        totalMinutes: 0,
        focusSeconds: 0,
        breakSeconds: 0,
        sessions: 0,
      },
      pendingSeconds: 0,
      pendingMode: mode,
    };
  }
  
  if (mode === "focus") {
    stats.todayStats.focusSeconds += seconds;
    stats.todayStats.totalMinutes = Math.round(stats.todayStats.focusSeconds / 60);
  } else {
    stats.todayStats.breakSeconds += seconds;
  }
  
  stats.pendingSeconds += seconds;
  stats.pendingMode = mode;
  
  saveOfflineStats(stats);
}

// Record offline session
export function recordOfflineSession(): void {
  if (typeof window === "undefined") return;
  
  const stats = getOfflineStats();
  if (stats) {
    stats.todayStats.sessions += 1;
    saveOfflineStats(stats);
  }
}

// Clear pending seconds (after successful sync)
export function clearPendingOfflineSeconds(): void {
  if (typeof window === "undefined") return;
  
  const stats = getOfflineStats();
  if (stats) {
    stats.pendingSeconds = 0;
    saveOfflineStats(stats);
  }
}

// Check if browser is online
export function isOnline(): boolean {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}

// Get queue size
export function getQueueSize(): number {
  return getOfflineQueue().length;
}
