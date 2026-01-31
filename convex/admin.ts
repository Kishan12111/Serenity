import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Check if user is admin
async function isAdmin(ctx: any, email: string): Promise<boolean> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", email.toLowerCase()))
    .first();
  return user?.role === "admin";
}

// Check if user is admin or moderator
async function isAdminOrMod(ctx: any, email: string): Promise<{ isAdmin: boolean; isMod: boolean; user: any }> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", email.toLowerCase()))
    .first();
  return {
    isAdmin: user?.role === "admin",
    isMod: user?.role === "moderator",
    user,
  };
}

// Get all users (admin only)
export const getAllUsers = query({
  args: {
    adminEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.adminEmail.toLowerCase()))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const users = await ctx.db.query("users").collect();
    
    // Return users without password hashes
    return users.map((user) => {
      const { passwordHash: _, ...safeUser } = user;
      return {
        ...safeUser,
        focusMinutes: Math.round(user.lifetimeTotals.totalFocusSeconds / 60),
      };
    });
  },
});

// Ban a user (admin only)
export const banUser = mutation({
  args: {
    adminEmail: v.string(),
    userEmail: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx, args.adminEmail))) {
      throw new Error("Unauthorized: Admin access required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role === "admin") {
      throw new Error("Cannot ban an admin");
    }

    await ctx.db.patch(user._id, {
      isBanned: true,
      bannedAt: Date.now(),
      bannedReason: args.reason || "Violated community guidelines",
    });

    return { success: true, message: `User ${args.userEmail} has been banned` };
  },
});

// Unban a user (admin only)
export const unbanUser = mutation({
  args: {
    adminEmail: v.string(),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx, args.adminEmail))) {
      throw new Error("Unauthorized: Admin access required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      isBanned: false,
      bannedAt: undefined,
      bannedReason: undefined,
    });

    return { success: true, message: `User ${args.userEmail} has been unbanned` };
  },
});

// Timeout a user (admin: any duration including lifetime, moderator: 10/20/30 min only)
export const timeoutUser = mutation({
  args: {
    moderatorEmail: v.string(),
    userEmail: v.string(),
    durationMinutes: v.optional(v.number()), // null/undefined = lifetime (admin only)
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { isAdmin: adminAccess, isMod, user: moderator } = await isAdminOrMod(ctx, args.moderatorEmail);
    
    if (!adminAccess && !isMod) {
      throw new Error("Unauthorized: Admin or Moderator access required");
    }

    // Moderators can only give 10, 20, 30 minute timeouts
    const allowedModDurations = [10, 20, 30];
    if (isMod && !adminAccess) {
      if (!args.durationMinutes || !allowedModDurations.includes(args.durationMinutes)) {
        throw new Error("Moderators can only give 10, 20, or 30 minute timeouts");
      }
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role === "admin") {
      throw new Error("Cannot timeout an admin");
    }

    if (user.role === "moderator" && isMod && !adminAccess) {
      throw new Error("Moderators cannot timeout other moderators");
    }

    // Calculate timeout end time
    const timeoutUntil = args.durationMinutes 
      ? Date.now() + (args.durationMinutes * 60 * 1000)
      : undefined; // undefined = lifetime timeout

    await ctx.db.patch(user._id, {
      isTimedOut: true,
      timeoutUntil,
      timeoutReason: args.reason || "Violated chat guidelines",
      timedOutAt: Date.now(),
      timedOutBy: args.moderatorEmail,
    });

    const durationText = args.durationMinutes ? `${args.durationMinutes} minutes` : "permanently";
    return { success: true, message: `${args.userEmail} has been timed out for ${durationText}` };
  },
});

// Remove timeout from user (admin or moderator)
export const removeTimeout = mutation({
  args: {
    moderatorEmail: v.string(),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const { isAdmin: adminAccess, isMod } = await isAdminOrMod(ctx, args.moderatorEmail);
    
    if (!adminAccess && !isMod) {
      throw new Error("Unauthorized: Admin or Moderator access required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Moderators can only remove timeouts they gave (unless it's timed, not lifetime)
    if (isMod && !adminAccess) {
      if (!user.timeoutUntil) {
        throw new Error("Moderators cannot remove lifetime timeouts");
      }
    }

    await ctx.db.patch(user._id, {
      isTimedOut: false,
      timeoutUntil: undefined,
      timeoutReason: undefined,
      timedOutAt: undefined,
      timedOutBy: undefined,
    });

    return { success: true, message: `Timeout removed from ${args.userEmail}` };
  },
});

// Make a user admin (admin only)
export const makeAdmin = mutation({
  args: {
    adminEmail: v.string(),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx, args.adminEmail))) {
      throw new Error("Unauthorized: Admin access required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, { role: "admin" });

    return { success: true, message: `User ${args.userEmail} is now an admin` };
  },
});

// Make a user moderator (admin only)
export const makeModerator = mutation({
  args: {
    adminEmail: v.string(),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx, args.adminEmail))) {
      throw new Error("Unauthorized: Admin access required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role === "admin") {
      throw new Error("Cannot demote an admin to moderator");
    }

    await ctx.db.patch(user._id, { role: "moderator" });

    return { success: true, message: `${args.userEmail} is now a moderator` };
  },
});

// Remove admin/moderator role (admin only)
export const removeRole = mutation({
  args: {
    adminEmail: v.string(),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx, args.adminEmail))) {
      throw new Error("Unauthorized: Admin access required");
    }

    if (args.adminEmail.toLowerCase() === args.userEmail.toLowerCase()) {
      throw new Error("Cannot remove your own role");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, { role: "user" });

    return { success: true, message: `Role removed from ${args.userEmail}` };
  },
});

// Legacy: Remove admin role
export const removeAdmin = mutation({
  args: {
    adminEmail: v.string(),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx, args.adminEmail))) {
      throw new Error("Unauthorized: Admin access required");
    }

    if (args.adminEmail.toLowerCase() === args.userEmail.toLowerCase()) {
      throw new Error("Cannot remove your own admin role");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, { role: "user" });

    return { success: true, message: `Admin role removed from ${args.userEmail}` };
  },
});

// Delete a single forum message (admin or moderator)
export const deleteMessage = mutation({
  args: {
    moderatorEmail: v.string(),
    messageId: v.id("forumMessages"),
  },
  handler: async (ctx, args) => {
    const { isAdmin: adminAccess, isMod } = await isAdminOrMod(ctx, args.moderatorEmail);
    
    if (!adminAccess && !isMod) {
      throw new Error("Unauthorized: Admin or Moderator access required");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    await ctx.db.delete(args.messageId);

    return { success: true, message: "Message deleted" };
  },
});

// Delete all forum messages by user (admin only)
export const deleteUserMessages = mutation({
  args: {
    adminEmail: v.string(),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx, args.adminEmail))) {
      throw new Error("Unauthorized: Admin access required");
    }

    const messages = await ctx.db
      .query("forumMessages")
      .collect();

    const userMessages = messages.filter(
      (m) => m.userEmail?.toLowerCase() === args.userEmail.toLowerCase()
    );

    for (const msg of userMessages) {
      await ctx.db.delete(msg._id);
    }

    return { 
      success: true, 
      message: `Deleted ${userMessages.length} messages from ${args.userEmail}` 
    };
  },
});

// Get admin stats
export const getAdminStats = query({
  args: {
    adminEmail: v.string(),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx, args.adminEmail))) {
      throw new Error("Unauthorized: Admin access required");
    }

    const users = await ctx.db.query("users").collect();
    const messages = await ctx.db.query("forumMessages").collect();

    const totalUsers = users.length;
    const bannedUsers = users.filter((u) => u.isBanned).length;
    const timedOutUsers = users.filter((u) => u.isTimedOut).length;
    const moderators = users.filter((u) => u.role === "moderator").length;
    const activeToday = users.filter(
      (u) => Date.now() - u.lastActiveAt < 24 * 60 * 60 * 1000
    ).length;
    const totalFocusHours = Math.round(
      users.reduce((sum, u) => sum + u.lifetimeTotals.totalFocusSeconds, 0) / 3600
    );

    return {
      totalUsers,
      bannedUsers,
      timedOutUsers,
      moderators,
      activeToday,
      totalMessages: messages.length,
      totalFocusHours,
    };
  },
});

// Get user's moderation status (for checking if can post)
export const getUserModerationStatus = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      return { canPost: true, reason: null };
    }

    if (user.isBanned) {
      return { 
        canPost: false, 
        reason: `Banned: ${user.bannedReason || "Violated community guidelines"}`,
        type: "banned"
      };
    }

    if (user.isTimedOut) {
      // Check if timeout has expired
      if (user.timeoutUntil && Date.now() > user.timeoutUntil) {
        // Timeout expired, clear it
        return { canPost: true, reason: null };
      }
      
      const remaining = user.timeoutUntil 
        ? Math.ceil((user.timeoutUntil - Date.now()) / 60000)
        : null;
      
      return { 
        canPost: false, 
        reason: user.timeoutUntil 
          ? `Timed out for ${remaining} more minute(s): ${user.timeoutReason || "Chat violation"}`
          : `Permanently timed out: ${user.timeoutReason || "Chat violation"}`,
        type: "timeout",
        expiresAt: user.timeoutUntil,
      };
    }

    return { canPost: true, reason: null };
  },
});

// Check if user is admin or moderator
export const checkModeratorStatus = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    return {
      isAdmin: user?.role === "admin",
      isModerator: user?.role === "moderator",
      role: user?.role || "user",
    };
  },
});

// Set user as first admin (one-time setup - only works if no admins exist)
export const setupFirstAdmin = mutation({
  args: {
    email: v.string(),
    secretKey: v.string(), // Simple protection
  },
  handler: async (ctx, args) => {
    // Check secret key (you should change this!)
    if (args.secretKey !== "serenity_admin_setup_2026") {
      throw new Error("Invalid secret key");
    }

    // Check if any admin exists
    const admins = await ctx.db.query("users").collect();
    const hasAdmin = admins.some((u) => u.role === "admin");

    if (hasAdmin) {
      throw new Error("Admin already exists. Use makeAdmin instead.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("User not found. Sign up first.");
    }

    await ctx.db.patch(user._id, { role: "admin" });

    return { success: true, message: `${args.email} is now the first admin!` };
  },
});
