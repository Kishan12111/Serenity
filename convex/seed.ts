import { mutation } from "./_generated/server";

// Simple hash function (same as in auth.ts)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `serenity_${Math.abs(hash).toString(36)}_${password.length}`;
}

// Update existing user's password hash
export const fixPassword = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "buzzshocker@serenity.app"))
      .first();

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Set password to "buzzshocker" with proper hash
    const correctHash = simpleHash("buzzshocker");
    
    await ctx.db.patch(user._id, {
      passwordHash: correctHash,
    });

    return { success: true, message: "Password fixed!", hash: correctHash };
  },
});

// Restore user's previous anonymous data
export const restoreData = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "buzzshocker@serenity.app"))
      .first();

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Calculate dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    // User had: streak 2 days, best streak 2, lifetime 91m, week/month ~100.5m, today 0
    // Total focus: 91 minutes = 5460 seconds
    // Distribute across yesterday and day before (since today is 0)
    
    const dailyStats = [
      {
        date: formatDate(today),
        totalMinutes: 0,
        focusSeconds: 0,
        breakSeconds: 0,
        sessions: 0,
      },
      {
        date: formatDate(yesterday),
        totalMinutes: 50,
        focusSeconds: 3000, // 50 minutes
        breakSeconds: 600,
        sessions: 2,
      },
      {
        date: formatDate(twoDaysAgo),
        totalMinutes: 41,
        focusSeconds: 2460, // 41 minutes
        breakSeconds: 300,
        sessions: 2,
      },
    ];

    // Total: 5460 seconds = 91 minutes
    const lifetimeTotals = {
      totalFocusSeconds: 5460, // 91 minutes
      totalBreakSeconds: 900,  // 15 minutes of breaks
      totalSessions: 4,
    };

    const streak = {
      currentStreak: 2,
      bestStreak: 2,
      lastActivityDate: formatDate(yesterday),
    };

    // Some recent sessions
    const recentSessions = [
      {
        startedAt: yesterday.getTime() - 30 * 60 * 1000,
        endedAt: yesterday.getTime(),
        durationMinutes: 25,
        mode: "focus",
        completed: true,
      },
      {
        startedAt: yesterday.getTime() - 60 * 60 * 1000,
        endedAt: yesterday.getTime() - 35 * 60 * 1000,
        durationMinutes: 25,
        mode: "focus",
        completed: true,
      },
      {
        startedAt: twoDaysAgo.getTime() - 30 * 60 * 1000,
        endedAt: twoDaysAgo.getTime(),
        durationMinutes: 25,
        mode: "focus",
        completed: true,
      },
      {
        startedAt: twoDaysAgo.getTime() - 60 * 60 * 1000,
        endedAt: twoDaysAgo.getTime() - 44 * 60 * 1000,
        durationMinutes: 16,
        mode: "focus",
        completed: true,
      },
    ];

    await ctx.db.patch(user._id, {
      streak,
      lifetimeTotals,
      dailyStats,
      recentSessions,
      lastActiveAt: Date.now(),
    });

    return { 
      success: true, 
      message: "Data restored!",
      streak,
      lifetimeTotals,
      dailyStatsCount: dailyStats.length,
    };
  },
});

// One-time seed function to create a user with existing data
export const seedUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "buzzshocker@serenity.app"))
      .first();

    if (existing) {
      return { success: false, message: "User already exists", userId: existing._id };
    }

    // Create user with buzzshocker username
    const userId = await ctx.db.insert("users", {
      email: "buzzshocker@serenity.app",
      passwordHash: "serenity_buzzshocker_10", // Simple hash for "buzzshocker"
      name: "Buzzshocker",
      visitorId: "buzzshocker_main",
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      settings: {
        wallpaper: "night-sky",
        customMinutes: "25",
        isPomodoro: false,
        pomodoroSettings: {
          focusTime: 25,
          shortBreak: 5,
          longBreak: 15,
        },
      },
      streak: {
        currentStreak: 0,
        bestStreak: 0,
        lastActivityDate: "",
      },
      lifetimeTotals: {
        totalFocusSeconds: 0,
        totalBreakSeconds: 0,
        totalSessions: 0,
      },
      dailyStats: [],
      recentSessions: [],
    });

    return { success: true, message: "User created successfully!", userId };
  },
});
