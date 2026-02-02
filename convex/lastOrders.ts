import { query, mutation } from "./_generated/server";

// Get all last order bundles (full snapshots stored)
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const bundles = await ctx.db.query("lastOrderBundles").order("desc").take(100);
    return bundles;
  },
});

// Get latest bundle (full snapshot stored)
export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    const bundle = await ctx.db.query("lastOrderBundles").order("desc").first();
    return bundle;
  },
});

// Clear all last order bundles
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const bundles = await ctx.db.query("lastOrderBundles").collect();
    for (const bundle of bundles) {
      await ctx.db.delete(bundle._id);
    }
    return { deleted: bundles.length };
  },
});
