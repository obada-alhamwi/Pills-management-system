import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all orders with enriched pill data
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").order("asc").take(1000);
    
    // Enrich with pill data
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        // Get pill by substance
        const pill = await ctx.db
          .query("pills")
          .withIndex("by_substance", (q) => q.eq("substance", order.substance))
          .first();
        
        let imageUrl = null;
        if (pill?.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(pill.imageStorageId);
        }
        
        return {
          ...order,
          name: pill?.name || '',
          company: pill?.company || '',
          pillsBl: pill?.pillsBl || 0,
          price: pill?.price || 0,
          imageStorageId: pill?.imageStorageId,
          imageUrl,
        };
      })
    );
    
    return enrichedOrders;
  },
});

// Get orders by substance (for cascading updates)
export const getBySubstance = query({
  args: { substance: v.string() },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_substance", (q) => q.eq("substance", args.substance))
      .collect();
    return orders;
  },
});

// Create or update order
export const save = mutation({
  args: {
    rowNumber: v.number(),
    substance: v.string(),
    currentBalance: v.number(),
    quantityOrder: v.number(),
    realOrder: v.number(),
    finalBalance: v.number(),
    pillQuantityOrder: v.number(),
    pillRealOrder: v.number(),
    urgent: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("rowNumber"), args.rowNumber))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("orders", {
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Delete order (cascades to damasOrders, processes, and costs)
export const remove = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    // Find all damasOrders that reference this order
    const damasOrders = await ctx.db
      .query("damasOrders")
      .withIndex("by_order", (q) => q.eq("orderId", args.id))
      .collect();

    // For each damasOrder, find and delete all processes and costs
    for (const damasOrder of damasOrders) {
      const processes = await ctx.db
        .query("processes")
        .withIndex("by_damas_order", (q) => q.eq("damasOrderId", damasOrder._id))
        .collect();

      // Find and delete all costs that reference this damasOrder
      const costs = await ctx.db
        .query("costs")
        .withIndex("by_damas_order", (q) => q.eq("damasOrderId", damasOrder._id))
        .collect();

      for (const cost of costs) {
        await ctx.db.delete(cost._id);
      }

      for (const process of processes) {
        await ctx.db.delete(process._id);
      }

      // Delete damasOrder
      await ctx.db.delete(damasOrder._id);
    }

    // Finally, delete order
    await ctx.db.delete(args.id);
  },
});

// Clear all orders
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();
    for (const order of orders) {
      await ctx.db.delete(order._id);
    }
    return { deleted: orders.length };
  },
});

// Send orders to Damas (mark for processing)
export const sendToDamas = mutation({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();
    
    for (const order of orders) {
      // Check if already in Damas
      const existing = await ctx.db
        .query("damasOrders")
        .withIndex("by_order", (q) => q.eq("orderId", order._id))
        .first();

      if (!existing) {
        await ctx.db.insert("damasOrders", {
          orderId: order._id,
          rowNumber: order.rowNumber,
          finalOrder: 0,
          bonus: 0,
          confirmed: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    return { sent: orders.length };
  },
});

// Update orders when pill changes (cascade update)
export const cascadeUpdateFromPill = mutation({
  args: {
    substance: v.string(),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_substance", (q) => q.eq("substance", args.substance))
      .collect();
    
    // Recalculate derived fields for all orders with this substance
    const now = Date.now();
    for (const order of orders) {
      await ctx.db.patch(order._id, {
        updatedAt: now,
      });
    }
    
    return { updated: orders.length };
  },
});
