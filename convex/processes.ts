import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all processes with enriched data
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const processes = await ctx.db.query("processes").order("asc").take(1000);

    // Enrich with damasOrder, order, and pill data
    const enrichedProcesses = await Promise.all(
      processes.map(async (process) => {
        // Get damasOrder
        const damasOrder = await ctx.db.get(process.damasOrderId);
        // Get order
        const order = await ctx.db.get(process.orderId);
        // Get pill
        const pill = order ? await ctx.db
          .query("pills")
          .withIndex("by_substance", (q) => q.eq("substance", order.substance))
          .first() : null;

        let imageUrl = null;
        if (pill?.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(pill.imageStorageId);
        }

        const finalAmountPackage = damasOrder ? damasOrder.finalOrder + damasOrder.bonus : 0;
        const finalAmountPill = pill?.pillsSy ? finalAmountPackage * pill.pillsSy : 0;

        return {
          ...process,
          substance: order?.substance || '',
          name: pill?.name || '',
          finalAmountPackage,
          pillsSy: pill?.pillsSy || 0,
          finalAmountPill,
          imageUrl,
          urgent: order?.urgent || false,
        };
      })
    );

    return enrichedProcesses;
  },
});

// Get process by ID with enriched data
export const getById = query({
  args: { id: v.id("processes") },
  handler: async (ctx, args) => {
    const process = await ctx.db.get(args.id);
    if (!process) return null;

    const damasOrder = await ctx.db.get(process.damasOrderId);
    const order = await ctx.db.get(process.orderId);
    const pill = order ? await ctx.db
      .query("pills")
      .withIndex("by_substance", (q) => q.eq("substance", order.substance))
      .first() : null;

    let imageUrl = null;
    if (pill?.imageStorageId) {
      imageUrl = await ctx.storage.getUrl(pill.imageStorageId);
    }

    const finalAmountPackage = damasOrder ? damasOrder.finalOrder + damasOrder.bonus : 0;
    const finalAmountPill = pill?.pillsSy ? finalAmountPackage * pill.pillsSy : 0;

    return {
      ...process,
      substance: order?.substance || '',
      name: pill?.name || '',
      finalAmountPackage,
      pillsSy: pill?.pillsSy || 0,
      finalAmountPill,
      imageUrl,
    };
  },
});

// Update process status and box number
export const update = mutation({
  args: {
    id: v.id("processes"),
    boxNumber: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("ordered"),
        v.literal("preparing"),
        v.literal("out_for_delivery"),
        v.literal("in_transit")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, boxNumber, status } = args;
    const updateData: { boxNumber?: string; status?: "ordered" | "preparing" | "out_for_delivery" | "in_transit"; updatedAt: number } = {
      updatedAt: Date.now(),
    };
    if (boxNumber !== undefined) updateData.boxNumber = boxNumber;
    if (status !== undefined) updateData.status = status;

    await ctx.db.patch(id, updateData);
    return { success: true };
  },
});

// Delete process and create cost entry (NOT used anymore, keeping for compatibility)
export const remove = mutation({
  args: { id: v.id("processes") },
  handler: async (ctx, args) => {
    const process = await ctx.db.get(args.id);
    if (!process) throw new Error("Process not found");

    // Delete process only - don't create last order bundle
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// Clear all processes
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const processes = await ctx.db.query("processes").collect();
    for (const process of processes) {
      await ctx.db.delete(process._id);
    }
    return { deleted: processes.length };
  },
});

// Delete all processes and move to Last Order (like static DeleteOrder)
export const deleteAllToLastOrder = mutation({
  args: {},
  handler: async (ctx) => {
    const processes = await ctx.db.query("processes").collect();
    if (processes.length === 0) {
      throw new Error("No process data to move.");
    }

    const damasOrderIds = processes.map(p => p.damasOrderId);
    const orderIds = processes.map(p => p.orderId);

    // Get related damas orders and enrich them
    const damasOrdersWithEnrichment = await Promise.all(
      damasOrderIds.map(async (id) => {
        const damasOrder = await ctx.db.get(id);
        if (!damasOrder) return null;

        const order = await ctx.db.get(damasOrder.orderId);
        if (!order) return damasOrder;

        const pill = await ctx.db
          .query("pills")
          .withIndex("by_substance", (q) => q.eq("substance", order.substance))
          .first();

        const finalAmountPackage = damasOrder.finalOrder + damasOrder.bonus;
        const finalAmountPill = pill?.pillsSy ? finalAmountPackage * pill.pillsSy : 0;
        const price = pill?.price || 0;
        const totalPrice = damasOrder.finalOrder * price;

        return {
          ...damasOrder,
          substance: order.substance,
          name: pill?.name || '',
          company: pill?.company || '',
          quantityOrder: order.pillRealOrder,
          pillsSy: pill?.pillsSy || 0,
          price,
          totalPrice,
          finalAmountPackage,
          finalAmountPill,
        };
      })
    );

    // Enrich processes
    const processesWithEnrichment = await Promise.all(
      processes.map(async (process) => {
        const damasOrder = damasOrdersWithEnrichment.find(d => d && d._id === process.damasOrderId);
        const order = await ctx.db.get(process.orderId);

        const pill = order ? await ctx.db
          .query("pills")
          .withIndex("by_substance", (q) => q.eq("substance", order.substance))
          .first() : null;

        let imageUrl = null;
        if (pill?.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(pill.imageStorageId);
        }

        const finalAmountPackage = damasOrder ? damasOrder.finalOrder + damasOrder.bonus : 0;
        const finalAmountPill = pill?.pillsSy ? finalAmountPackage * pill.pillsSy : 0;

        return {
          ...process,
          damasOrderId: process.damasOrderId,
          orderId: process.orderId,
          substance: order?.substance || '',
          name: pill?.name || '',
          finalAmountPackage,
          pillsSy: pill?.pillsSy || 0,
          finalAmountPill,
          imageUrl,
          urgent: order?.urgent || false,
        };
      })
    );

    // Get and enrich orders
    const ordersWithEnrichment = await Promise.all(
      orderIds.map(async (id) => {
        const order = await ctx.db.get(id);
        if (!order) return null;

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
          imageUrl,
        };
      })
    );

    // Calculate total cost
    let totalCost = 0;
    for (const damasOrder of damasOrdersWithEnrichment) {
      if (damasOrder && 'totalPrice' in damasOrder) {
        totalCost += damasOrder.totalPrice;
      }
    }

    // Create last order bundle with full data snapshots
    const bundleId = `bundle_${Date.now()}`;
    await ctx.db.insert("lastOrderBundles", {
      bundleId,
      processes: processesWithEnrichment.filter(p => p !== null),
      damasOrders: damasOrdersWithEnrichment.filter(d => d !== null),
      orders: ordersWithEnrichment.filter(o => o !== null),
      totalCost,
      createdAt: Date.now(),
      createdBy: "system",
    });

    // Delete all processes
    for (const process of processes) {
      await ctx.db.delete(process._id);
    }

    // Delete all related damas orders (to clear Damas page)
    for (const damasOrderId of damasOrderIds) {
      await ctx.db.delete(damasOrderId);
    }

    // Delete all related orders (to clear Order page)
    for (const orderId of orderIds) {
      await ctx.db.delete(orderId);
    }

    return { moved: processes.length, bundleId };
  },
});
