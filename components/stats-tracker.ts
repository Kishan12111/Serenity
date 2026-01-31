export interface DailyStats {
  date: string;
  totalMinutes: number;
  sessions: number;
  focusSeconds?: number; // Track raw seconds for accurate calculations
}

export interface AppStats {
  [date: string]: DailyStats;
}

const STORAGE_KEY = 'serenity_stats';
const STREAK_KEY = 'serenity_streak';
const TOTALS_KEY = 'serenity_totals';
const BACKUP_KEY = 'serenity_backup_file';

export type LifetimeTotals = {
  focusSeconds: number;
  breakSeconds: number;
  updatedAt?: string;
};

type BackupSnapshot = {
  stats: AppStats;
  streak: ReturnType<typeof getStreakData>;
  totals: LifetimeTotals;
  savedAt: string;
};

const nowIso = () => new Date().toISOString();

function readBackup(): BackupSnapshot | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(BACKUP_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BackupSnapshot;
  } catch {
    return null;
  }
}

let lastBackupTs = 0;
function writeBackup(stats: AppStats, streak: ReturnType<typeof getStreakData>, totals: LifetimeTotals) {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (now - lastBackupTs < 5000) return; // throttle to reduce churn
  lastBackupTs = now;
  const snapshot: BackupSnapshot = {
    stats,
    streak,
    totals,
    savedAt: nowIso(),
  };
  localStorage.setItem(BACKUP_KEY, JSON.stringify(snapshot));
}

export function initStats(): AppStats {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);

  // Recover from backup if primary stats are missing
  const backup = readBackup();
  if (backup) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(backup.stats));
    localStorage.setItem(STREAK_KEY, JSON.stringify(backup.streak));
    localStorage.setItem(TOTALS_KEY, JSON.stringify(backup.totals));
    return backup.stats;
  }

  return {};
}

export function getTodayKey(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export function getTodayStats(): DailyStats {
  const stats = initStats();
  const todayKey = getTodayKey();
  return (
    stats[todayKey] || {
      date: todayKey,
      totalMinutes: 0,
      sessions: 0,
      focusSeconds: 0,
    }
  );
}

export function recordSession(focusMinutes: number): void {
  if (typeof window === 'undefined') return;

  const stats = initStats();
  const todayKey = getTodayKey();

  if (!stats[todayKey]) {
    stats[todayKey] = {
      date: todayKey,
      totalMinutes: 0,
      sessions: 0,
    };
  }

  // Minutes are tracked continuously during focus; session completion only bumps the session count.
  stats[todayKey].sessions += 1;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  updateStreak();
  writeBackup(stats, getStreakData(), getLifetimeTotals());
}

export function updateStreak(): void {
  if (typeof window === 'undefined') return;

  const streakData = getStreakData();
  const todayKey = getTodayKey();
  const stats = initStats();

  // If user has sessions today, maintain or start streak
  if (stats[todayKey] && stats[todayKey].sessions > 0) {
    if (!streakData.lastActivityDate) {
      // First time
      streakData.currentStreak = 1;
      streakData.lastActivityDate = todayKey;
    } else {
      const lastDate = new Date(streakData.lastActivityDate);
      const today = new Date(todayKey);

      // Check if it's consecutive
      lastDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        // Consecutive day
        streakData.currentStreak += 1;
        streakData.lastActivityDate = todayKey;
      } else if (daysDiff === 0) {
        // Same day, no change
      } else {
        // Streak broken
        streakData.currentStreak = 1;
        streakData.lastActivityDate = todayKey;
      }
    }

    // Update best streak
    if (streakData.currentStreak > (streakData.bestStreak || 0)) {
      streakData.bestStreak = streakData.currentStreak;
    }

    localStorage.setItem(STREAK_KEY, JSON.stringify(streakData));
  }
}

export function getStreakData(): {
  currentStreak: number;
  lastActivityDate: string;
  bestStreak: number;
} {
  if (typeof window === 'undefined')
    return {
      currentStreak: 0,
      lastActivityDate: '',
      bestStreak: 0,
    };

  const stored = localStorage.getItem(STREAK_KEY);
  const data = stored
    ? JSON.parse(stored)
    : {
        currentStreak: 0,
        lastActivityDate: '',
        bestStreak: 0,
      };

  return data;
}

export function getWeeklyStats(): DailyStats[] {
  const stats = initStats();
  const weekStats: DailyStats[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    weekStats.push(
      stats[key] || {
        date: key,
        totalMinutes: 0,
        sessions: 0,
      }
    );
  }

  return weekStats;
}

export function getMonthlyStats(): DailyStats[] {
  const stats = initStats();
  const monthStats: DailyStats[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    monthStats.push(
      stats[key] || {
        date: key,
        totalMinutes: 0,
        sessions: 0,
      }
    );
  }

  return monthStats;
}

export function getTotalFocusTime(range: 'day' | 'week' | 'month'): number {
  let data: DailyStats[] = [];

  if (range === 'day') {
    const today = getTodayStats();
    return today.totalMinutes;
  } else if (range === 'week') {
    data = getWeeklyStats();
  } else {
    data = getMonthlyStats();
  }

  return data.reduce((total, day) => total + day.totalMinutes, 0);
}

export function getTotalSessions(range: 'day' | 'week' | 'month'): number {
  let data: DailyStats[] = [];

  if (range === 'day') {
    const today = getTodayStats();
    return today.sessions;
  } else if (range === 'week') {
    data = getWeeklyStats();
  } else {
    data = getMonthlyStats();
  }

  return data.reduce((total, day) => total + day.sessions, 0);
}

export function getStreak(): number {
  const streakData = getStreakData();
  if (!streakData.lastActivityDate) return 0;

  const lastDate = new Date(streakData.lastActivityDate);
  const today = new Date();

  lastDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor(
    (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If more than 1 day has passed, streak is broken
  if (daysDiff > 1) {
    return 0;
  }

  return streakData.currentStreak;
}

export function getBestStreak(): number {
  const streakData = getStreakData();
  return streakData.bestStreak || 0;
}

export function updateBestStreak(): void {
  if (typeof window === 'undefined') return;

  const streakData = getStreakData();
  if (streakData.currentStreak > streakData.bestStreak) {
    streakData.bestStreak = streakData.currentStreak;
    localStorage.setItem(STREAK_KEY, JSON.stringify(streakData));
  }
}

export function getLifetimeTotals(): LifetimeTotals {
  if (typeof window === 'undefined') return { focusSeconds: 0, breakSeconds: 0 };
  const stored = localStorage.getItem(TOTALS_KEY);
  return stored
    ? JSON.parse(stored)
    : {
        focusSeconds: 0,
        breakSeconds: 0,
      };
}

export function addElapsedSeconds(mode: 'focus' | 'shortBreak' | 'longBreak', seconds: number): void {
  if (typeof window === 'undefined' || seconds <= 0) return;
  const totals = getLifetimeTotals();
  if (mode === 'focus') {
    totals.focusSeconds += seconds;
    const stats = initStats();
    const todayKey = getTodayKey();
    if (!stats[todayKey]) {
      stats[todayKey] = { date: todayKey, totalMinutes: 0, sessions: 0, focusSeconds: 0 };
    }
    // Track seconds accurately, calculate minutes from seconds
    stats[todayKey].focusSeconds = (stats[todayKey].focusSeconds || 0) + seconds;
    stats[todayKey].totalMinutes = Math.round(stats[todayKey].focusSeconds / 60);
    stats[todayKey].sessions = Math.max(1, stats[todayKey].sessions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    updateStreak();
  } else {
    totals.breakSeconds += seconds;
  }
  totals.updatedAt = new Date().toISOString();
  localStorage.setItem(TOTALS_KEY, JSON.stringify(totals));
  writeBackup(initStats(), getStreakData(), totals);
}

export function getLifetimeFocusMinutes(): number {
  const totals = getLifetimeTotals();
  return Math.round(totals.focusSeconds / 60);
}
