import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Unified users table - stores user profile, auth, settings, and all stats in one place
  users: defineTable({
    // Authentication fields
    email: v.string(),
    passwordHash: v.string(), // Simple hash for demo (use proper auth in production)
    name: v.optional(v.string()),
    
    // Role and status
    role: v.optional(v.string()), // 'admin' | 'moderator' | 'user' | undefined (default user)
    isBanned: v.optional(v.boolean()), // If true, user cannot access the app
    bannedAt: v.optional(v.number()),
    bannedReason: v.optional(v.string()),
    
    // Timeout fields (temporary mute from forum)
    isTimedOut: v.optional(v.boolean()),
    timeoutUntil: v.optional(v.number()), // Timestamp when timeout expires (null = lifetime)
    timeoutReason: v.optional(v.string()),
    timedOutAt: v.optional(v.number()),
    timedOutBy: v.optional(v.string()), // Email of admin/mod who issued timeout
    
    // Legacy support for anonymous users migration
    visitorId: v.optional(v.string()),
    
    // Timestamps
    createdAt: v.number(),
    lastActiveAt: v.number(),
    
    // User settings
    settings: v.object({
      wallpaper: v.string(),
      customMinutes: v.string(),
      isPomodoro: v.boolean(),
      pomodoroSettings: v.object({
        focusTime: v.number(),
        shortBreak: v.number(),
        longBreak: v.number(),
      }),
    }),
    
    // Streak data (embedded in user document)
    streak: v.object({
      currentStreak: v.number(),
      bestStreak: v.number(),
      lastActivityDate: v.string(), // Format: YYYY-MM-DD
    }),
    
    // Lifetime totals (cached for quick access)
    lifetimeTotals: v.object({
      totalFocusSeconds: v.number(),
      totalBreakSeconds: v.number(),
      totalSessions: v.number(),
    }),
    
    // Daily stats - stored as an array of recent days (last 90 days max)
    dailyStats: v.array(
      v.object({
        date: v.string(), // Format: YYYY-MM-DD
        totalMinutes: v.number(),
        focusSeconds: v.number(),
        breakSeconds: v.number(),
        sessions: v.number(),
      })
    ),
    
    // Recent focus sessions (last 50 sessions for history)
    recentSessions: v.array(
      v.object({
        startedAt: v.number(),
        endedAt: v.number(),
        durationMinutes: v.number(),
        mode: v.string(), // 'focus' | 'shortBreak' | 'longBreak'
        completed: v.boolean(),
        // Optional metadata fields
        label: v.optional(v.string()),
        labelCategory: v.optional(v.string()),
        startHour: v.optional(v.number()),
      })
    ),
  })
    .index("by_email", ["email"])
    .index("by_visitorId", ["visitorId"]),

  // Forum messages for FocusForum
  forumMessages: defineTable({
    userId: v.optional(v.id("users")),
    userName: v.string(),
    userEmail: v.optional(v.string()),
    message: v.string(),
    createdAt: v.number(),
    // Optional: user's current streak for showing badges
    userStreak: v.optional(v.number()),
  })
    .index("by_createdAt", ["createdAt"]),
});
