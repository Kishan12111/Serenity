import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user by email
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) return null;

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  },
});

// Get user by visitorId (for anonymous users)
export const getUserByVisitorId = query({
  args: {
    visitorId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_visitorId", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (!user) return null;

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  },
});

// Update user settings
export const updateSettings = mutation({
  args: {
    email: v.string(),
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
      settings: args.settings,
      lastActiveAt: Date.now(),
    });

    return { success: true };
  },
});

// Update settings by visitorId (for anonymous users)
export const updateSettingsByVisitorId = mutation({
  args: {
    visitorId: v.string(),
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
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_visitorId", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      settings: args.settings,
      lastActiveAt: Date.now(),
    });

    return { success: true };
  },
});
