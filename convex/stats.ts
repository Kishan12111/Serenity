import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MAX_DAILY_STATS = 90; // Keep last 90 days
const MAX_SESSIONS = 50; // Keep last 50 sessions

// Helper: Get user by email or visitorId
async function getUser(ctx: any, identifier: { email?: string; visitorId?: string }) {
  if (identifier.email) {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identifier.email!.toLowerCase()))
      .first();
  }
  if (identifier.visitorId) {
    return await ctx.db
      .query("users")
      .withIndex("by_visitorId", (q: any) => q.eq("visitorId", identifier.visitorId))
      .first();
  }
  return null;
}

// Record elapsed focus/break time
export const addElapsedTime = mutation({
  args: {
    email: v.optional(v.string()),
    visitorId: v.optional(v.string()),
    mode: v.string(), // 'focus' | 'shortBreak' | 'longBreak'
    seconds: v.number(),
    clientDate: v.optional(v.string()), // Client's local date in YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    if (args.seconds <= 0) return;

    const user = await getUser(ctx, { email: args.email, visitorId: args.visitorId });
    if (!user) return;

    // Use client's local date if provided, otherwise fallback to server UTC
    const today = args.clientDate || new Date().toISOString().split("T")[0];
    const dailyStats = [...user.dailyStats];
    
    // Find or create today's stats
    const todayIndex = dailyStats.findIndex((s) => s.date === today);
    
    if (todayIndex >= 0) {
      const todayStats = dailyStats[todayIndex];
      if (args.mode === "focus") {
        todayStats.focusSeconds += args.seconds;
        todayStats.totalMinutes = Math.floor(todayStats.focusSeconds / 60);
      } else {
        todayStats.breakSeconds += args.seconds;
      }
      dailyStats[todayIndex] = todayStats;
    } else {
      // Add new day entry
      dailyStats.push({
        date: today,
        totalMinutes: args.mode === "focus" ? Math.floor(args.seconds / 60) : 0,
        focusSeconds: args.mode === "focus" ? args.seconds : 0,
        breakSeconds: args.mode !== "focus" ? args.seconds : 0,
        sessions: 0,
      });
    }

    // Keep only last MAX_DAILY_STATS days
    const sortedStats = dailyStats.sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAX_DAILY_STATS);

    // Update lifetime totals
    const lifetimeTotals = { ...user.lifetimeTotals };
    if (args.mode === "focus") {
      lifetimeTotals.totalFocusSeconds += args.seconds;
    } else {
      lifetimeTotals.totalBreakSeconds += args.seconds;
    }

    // Update streak if focus mode (this marks activity for today)
    let streak = { ...user.streak };
    if (args.mode === "focus") {
      streak = updateStreak(streak, today);
    }

    await ctx.db.patch(user._id, {
      dailyStats: sortedStats,
      lifetimeTotals,
      streak,
      lastActiveAt: Date.now(),
    });
  },
});

// Record a completed session
export const recordSession = mutation({
  args: {
    email: v.optional(v.string()),
    visitorId: v.optional(v.string()),
    durationMinutes: v.number(),
    mode: v.string(),
    clientDate: v.optional(v.string()), // Client's local date in YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, { email: args.email, visitorId: args.visitorId });
    if (!user) return;

    const now = Date.now();
    // Use client's local date if provided, otherwise fallback to server UTC
    const today = args.clientDate || new Date().toISOString().split("T")[0];

    // Add to recent sessions
    const recentSessions = [
      {
        startedAt: now - args.durationMinutes * 60 * 1000,
        endedAt: now,
        durationMinutes: args.durationMinutes,
        mode: args.mode,
        completed: true,
      },
      ...user.recentSessions,
    ].slice(0, MAX_SESSIONS);

    // Update daily stats session count
    const dailyStats = [...user.dailyStats];
    const todayIndex = dailyStats.findIndex((s) => s.date === today);
    
    if (todayIndex >= 0) {
      dailyStats[todayIndex].sessions += 1;
    } else {
      dailyStats.push({
        date: today,
        totalMinutes: 0,
        focusSeconds: 0,
        breakSeconds: 0,
        sessions: 1,
      });
    }

    // Update lifetime totals
    const lifetimeTotals = { ...user.lifetimeTotals };
    lifetimeTotals.totalSessions += 1;

    // Update streak if focus mode
    let streak = { ...user.streak };
    if (args.mode === "focus") {
      streak = updateStreak(streak, today);
    }

    const sortedStats = dailyStats.sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAX_DAILY_STATS);

    await ctx.db.patch(user._id, {
      recentSessions,
      dailyStats: sortedStats,
      lifetimeTotals,
      streak,
      lastActiveAt: Date.now(),
    });
  },
});

// Helper function to update streak
function updateStreak(
  currentStreak: { currentStreak: number; bestStreak: number; lastActivityDate: string },
  today: string
): { currentStreak: number; bestStreak: number; lastActivityDate: string } {
  // First activity or invalid lastActivityDate
  if (!currentStreak.lastActivityDate || currentStreak.lastActivityDate === "") {
    return {
      currentStreak: 1,
      bestStreak: Math.max(1, currentStreak.bestStreak),
      lastActivityDate: today,
    };
  }

  // Parse dates as UTC to avoid timezone issues
  // Date strings are in format "YYYY-MM-DD"
  const [lastYear, lastMonth, lastDay] = currentStreak.lastActivityDate.split("-").map(Number);
  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
  
  // Create dates at noon UTC to avoid DST issues
  const lastDate = Date.UTC(lastYear, lastMonth - 1, lastDay, 12, 0, 0);
  const todayDate = Date.UTC(todayYear, todayMonth - 1, todayDay, 12, 0, 0);

  const daysDiff = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

  let newStreak = currentStreak.currentStreak;

  if (daysDiff === 1) {
    // Consecutive day
    newStreak = currentStreak.currentStreak + 1;
  } else if (daysDiff === 0) {
    // Same day, no change needed - just ensure lastActivityDate is set
    return {
      ...currentStreak,
      lastActivityDate: today,
    };
  } else {
    // Streak broken (daysDiff > 1 or negative, which shouldn't happen)
    newStreak = 1;
  }

  return {
    currentStreak: newStreak,
    bestStreak: Math.max(newStreak, currentStreak.bestStreak),
    lastActivityDate: today,
  };
}

// Daily stats type
type DailyStat = {
  date: string;
  totalMinutes: number;
  focusSeconds: number;
  breakSeconds: number;
  sessions: number;
};

// Get today's stats
export const getTodayStats = query({
  args: {
    email: v.optional(v.string()),
    visitorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, { email: args.email, visitorId: args.visitorId });
    
    const today = new Date().toISOString().split("T")[0];
    const defaultStats: DailyStat = {
      date: today,
      totalMinutes: 0,
      focusSeconds: 0,
      breakSeconds: 0,
      sessions: 0,
    };

    if (!user) return defaultStats;

    const todayStats = user.dailyStats.find((s: DailyStat) => s.date === today);
    return todayStats || defaultStats;
  },
});

// Get stats for a date range (for charts)
export const getStatsRange = query({
  args: {
    email: v.optional(v.string()),
    visitorId: v.optional(v.string()),
    days: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, { email: args.email, visitorId: args.visitorId });
    if (!user) return [];

    // Sort by date descending and take last N days
    return user.dailyStats
      .sort((a: DailyStat, b: DailyStat) => b.date.localeCompare(a.date))
      .slice(0, args.days)
      .reverse();
  },
});

// Get streak data - calculates current streak based on last activity
export const getStreak = query({
  args: {
    email: v.optional(v.string()),
    visitorId: v.optional(v.string()),
    clientDate: v.optional(v.string()), // Client's local date in YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, { email: args.email, visitorId: args.visitorId });
    
    if (!user) {
      return {
        currentStreak: 0,
        bestStreak: 0,
        lastActivityDate: "",
      };
    }

    const streak = user.streak;
    
    // If no last activity, return as-is
    if (!streak.lastActivityDate || streak.lastActivityDate === "") {
      return streak;
    }

    // Use client's date or server's UTC date
    const today = args.clientDate || new Date().toISOString().split("T")[0];
    
    // Calculate days since last activity to check if streak is broken
    const [lastYear, lastMonth, lastDay] = streak.lastActivityDate.split("-").map(Number);
    const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
    
    const lastDate = Date.UTC(lastYear, lastMonth - 1, lastDay, 12, 0, 0);
    const todayDate = Date.UTC(todayYear, todayMonth - 1, todayDay, 12, 0, 0);
    
    const daysDiff = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
    
    // If more than 1 day has passed since last activity, streak is broken
    if (daysDiff > 1) {
      return {
        currentStreak: 0, // Streak is broken, show 0 until they focus again
        bestStreak: streak.bestStreak,
        lastActivityDate: streak.lastActivityDate,
      };
    }
    
    return streak;
  },
});

// Get lifetime totals
export const getLifetimeTotals = query({
  args: {
    email: v.optional(v.string()),
    visitorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, { email: args.email, visitorId: args.visitorId });
    
    if (!user) {
      return {
        totalFocusSeconds: 0,
        totalBreakSeconds: 0,
        totalSessions: 0,
        focusMinutes: 0,
        focusHours: 0,
      };
    }

    return {
      ...user.lifetimeTotals,
      focusMinutes: Math.round(user.lifetimeTotals.totalFocusSeconds / 60),
      focusHours: parseFloat((user.lifetimeTotals.totalFocusSeconds / 3600).toFixed(1)),
    };
  },
});

// Get recent sessions
export const getRecentSessions = query({
  args: {
    email: v.optional(v.string()),
    visitorId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx, { email: args.email, visitorId: args.visitorId });
    if (!user) return [];

    return user.recentSessions.slice(0, args.limit || 10);
  },
});
