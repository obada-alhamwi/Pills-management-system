import { mutation } from "./_generated/server";

// Clear all tables except users and sessions
export const clearAllTables = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear pills
    const pills = await ctx.db.query("pills").collect();
    for (const pill of pills) {
      if (pill.imageStorageId) {
        await ctx.storage.delete(pill.imageStorageId);
      }
      await ctx.db.delete(pill._id);
    }

    // Clear orders
    const orders = await ctx.db.query("orders").collect();
    for (const order of orders) {
      await ctx.db.delete(order._id);
    }

    // Clear damas orders
    const damasOrders = await ctx.db.query("damasOrders").collect();
    for (const damasOrder of damasOrders) {
      await ctx.db.delete(damasOrder._id);
    }

    // Clear processes
    const processes = await ctx.db.query("processes").collect();
    for (const process of processes) {
      await ctx.db.delete(process._id);
    }

    // Clear costs
    const costs = await ctx.db.query("costs").collect();
    for (const cost of costs) {
      await ctx.db.delete(cost._id);
    }

    // Clear last order bundles
    const bundles = await ctx.db.query("lastOrderBundles").collect();
    for (const bundle of bundles) {
      await ctx.db.delete(bundle._id);
    }

    return {
      deleted: {
        pills: pills.length,
        orders: orders.length,
        damasOrders: damasOrders.length,
        processes: processes.length,
        costs: costs.length,
        lastOrderBundles: bundles.length,
      },
    };
  },
});
