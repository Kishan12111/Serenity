import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Simple hash function for demo purposes
// In production, use proper auth like Clerk or bcrypt on a server
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Add salt-like string for basic security
  return `serenity_${Math.abs(hash).toString(36)}_${password.length}`;
}

function verifyPassword(password: string, hash: string): boolean {
  return simpleHash(password) === hash;
}

// Default user data
const defaultUserData = {
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
};

// Sign up a new user
export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
    visitorId: v.optional(v.string()), // For migrating anonymous user data
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (existing) {
      throw new Error("An account with this email already exists");
    }

    // Check for existing anonymous user data to migrate
    let migratedData: typeof defaultUserData = { ...defaultUserData };
    if (args.visitorId) {
      const anonymousUser = await ctx.db
        .query("users")
        .withIndex("by_visitorId", (q) => q.eq("visitorId", args.visitorId))
        .first();
      
      if (anonymousUser) {
        // Migrate data from anonymous user
        migratedData = {
          settings: anonymousUser.settings,
          streak: anonymousUser.streak,
          lifetimeTotals: anonymousUser.lifetimeTotals,
          dailyStats: anonymousUser.dailyStats as typeof defaultUserData.dailyStats,
          recentSessions: anonymousUser.recentSessions as typeof defaultUserData.recentSessions,
        };
        // Delete the anonymous user record
        await ctx.db.delete(anonymousUser._id);
      }
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      passwordHash: simpleHash(args.password),
      name: args.name,
      visitorId: args.visitorId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      ...migratedData,
    });

    const user = await ctx.db.get(userId);
    
    // Return user without password hash
    if (user) {
      const { passwordHash: _, ...safeUser } = user;
      return { success: true, user: safeUser };
    }
    
    throw new Error("Failed to create user");
  },
});

// Sign in an existing user
export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check if user is banned
    if (user.isBanned) {
      throw new Error(`Account banned: ${user.bannedReason || "Contact support for more information"}`);
    }

    if (!verifyPassword(args.password, user.passwordHash)) {
      throw new Error("Invalid email or password");
    }

    // Update last active time
    await ctx.db.patch(user._id, { lastActiveAt: Date.now() });

    // Return user without password hash
    const { passwordHash: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  },
});

// Get current user by email (for session validation)
export const getCurrentUser = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      return null;
    }

    // Return user without password hash
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      name: args.name,
      lastActiveAt: Date.now(),
    });

    return { success: true };
  },
});

// Change password
export const changePassword = mutation({
  args: {
    email: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (!verifyPassword(args.currentPassword, user.passwordHash)) {
      throw new Error("Current password is incorrect");
    }

    await ctx.db.patch(user._id, {
      passwordHash: simpleHash(args.newPassword),
      lastActiveAt: Date.now(),
    });

    return { success: true };
  },
});

// Create or get anonymous user (for users who haven't signed up yet)
export const getOrCreateAnonymousUser = mutation({
  args: {
    visitorId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_visitorId", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { lastActiveAt: Date.now() });
      const { passwordHash: _, ...safeUser } = existing;
      return safeUser;
    }

    // Create new anonymous user
    const userId = await ctx.db.insert("users", {
      email: `anonymous_${args.visitorId}@serenity.local`,
      passwordHash: "", // No password for anonymous users
      visitorId: args.visitorId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      ...defaultUserData,
    });

    const user = await ctx.db.get(userId);
    if (user) {
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    }
    
    throw new Error("Failed to create anonymous user");
  },
});
