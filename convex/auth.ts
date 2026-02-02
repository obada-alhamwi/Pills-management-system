import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Login mutation
export const login = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    if (!user) {
      throw new Error("Invalid username or password");
    }
    
    if (user.password !== args.password) {
      throw new Error("Invalid username or password");
    }
    
    // Create session token
    const token = crypto.randomUUID();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      createdAt: Date.now(),
    });
    
    return {
      token,
      user: {
        _id: user._id,
        username: user.username,
        pages: user.pages,
      },
    };
  },
});

// Logout mutation
export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});
