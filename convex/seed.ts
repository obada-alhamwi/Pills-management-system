import { mutation } from "./_generated/server";

// Seed users mutation - run this once to create all users
export const seedUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const users = [
      {
        username: "ahmad_kahaleh",
        password: "ahmad123",
        pages: ["order", "management", "cost", "last_order"],
      },
      {
        username: "anas_alhamwi",
        password: "anas123",
        pages: ["damas", "cost", "last_order"],
      },
      {
        username: "youssef_almasri",
        password: "youssef123",
        pages: ["damas"],
      },
      {
        username: "obada_alhamwi",
        password: "obada123",
        pages: ["data", "process", "last_order"],
      },
      {
        username: "hamza",
        password: "hamza123",
        pages: ["order", "management"],
      },
    ];

    const results = [];
    for (const userData of users) {
      // Check if user already exists
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", userData.username))
        .first();

      if (!existing) {
        const userId = await ctx.db.insert("users", userData);
        results.push({ username: userData.username, created: true, id: userId });
      } else {
        results.push({ username: userData.username, created: false, reason: "already exists" });
      }
    }

    return results;
  },
});

// Get all users (for admin purposes)
export const getAllUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(u => ({
      _id: u._id,
      username: u.username,
      pages: u.pages,
    }));
  },
});
