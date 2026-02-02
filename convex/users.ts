import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Query to get current user from session token
export const getCurrentUser = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.token) return null;
    
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token!))
      .first();
    
    if (!session) return null;
    
    const user = await ctx.db.get(session.userId);
    if (!user) return null;
    
    return {
      _id: user._id,
      username: user.username,
      pages: user.pages,
    };
  },
});

// Query to get user by username (for seeding)
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    return user;
  },
});

// Mutation to update user pages
export const updatePages = mutation({
  args: {
    username: v.string(),
    pages: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    if (!user) {
      throw new Error(`User ${args.username} not found`);
    }
    
    await ctx.db.patch(user._id, {
      pages: args.pages,
    });
    
    return { success: true, username: args.username, pages: args.pages };
  },
});
