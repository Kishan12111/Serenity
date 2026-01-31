import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MAX_MESSAGES = 100; // Keep last 100 messages

// Get recent forum messages
export const getMessages = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const messages = await ctx.db
      .query("forumMessages")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
    
    // Return in chronological order (oldest first)
    return messages.reverse();
  },
});

// Send a new message
export const sendMessage = mutation({
  args: {
    email: v.optional(v.string()),
    visitorId: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.message.trim()) return null;
    
    // Get user info
    let user = null;
    if (args.email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!.toLowerCase()))
        .first();
    } else if (args.visitorId) {
      user = await ctx.db
        .query("users")
        .withIndex("by_visitorId", (q) => q.eq("visitorId", args.visitorId))
        .first();
    }

    const userName = user?.name || user?.email?.split("@")[0] || "Anonymous";
    const userStreak = user?.streak?.currentStreak || 0;

    // Insert new message
    const messageId = await ctx.db.insert("forumMessages", {
      userId: user?._id,
      userName,
      userEmail: user?.email,
      message: args.message.trim().slice(0, 500), // Limit message length
      createdAt: Date.now(),
      userStreak,
    });

    // Cleanup old messages (keep only last MAX_MESSAGES)
    const allMessages = await ctx.db
      .query("forumMessages")
      .withIndex("by_createdAt")
      .order("asc")
      .collect();

    if (allMessages.length > MAX_MESSAGES) {
      const toDelete = allMessages.slice(0, allMessages.length - MAX_MESSAGES);
      for (const msg of toDelete) {
        await ctx.db.delete(msg._id);
      }
    }

    return messageId;
  },
});

// Get message count (for unread indicator)
export const getMessageCount = query({
  args: {
    since: v.optional(v.number()), // Timestamp to count messages after
  },
  handler: async (ctx, args) => {
    if (!args.since) {
      const messages = await ctx.db
        .query("forumMessages")
        .withIndex("by_createdAt")
        .order("desc")
        .take(100);
      return messages.length;
    }

    const messages = await ctx.db
      .query("forumMessages")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    return messages.filter((m) => m.createdAt > args.since!).length;
  },
});
