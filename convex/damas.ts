import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all Damas orders with enriched data from orders and pills
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const damasOrders = await ctx.db.query("damasOrders").order("asc").take(1000);
    
    // Enrich with order and pill data
    const enrichedOrders = await Promise.all(
      damasOrders.map(async (damasOrder) => {
        // Get the referenced order
        const order = await ctx.db.get(damasOrder.orderId);
        
        if (!order) {
          return {
            ...damasOrder,
            substance: '',
            name: '',
            company: '',
            quantityOrder: 0,
            pillsSy: 0,
            price: 0,
            totalPrice: 0,
            finalAmountPackage: damasOrder.finalOrder + damasOrder.bonus,
            finalAmountPill: 0,
            imageUrl: null,
            urgent: false,
          };
        }
        
        // Get pill data
        const pill = await ctx.db
          .query("pills")
          .withIndex("by_substance", (q) => q.eq("substance", order.substance))
          .first();
        
        let imageUrl = null;
        if (pill?.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(pill.imageStorageId);
        }
        
        const finalAmountPackage = damasOrder.finalOrder + damasOrder.bonus;
        const finalAmountPill = pill?.pillsSy ? finalAmountPackage * pill.pillsSy : 0;
        const price = pill?.price || 0;
        const totalPrice = damasOrder.finalOrder * price;
        
        return {
          ...damasOrder,
          substance: order.substance,
          name: pill?.name || '',
          company: pill?.company || '',
          quantityOrder: order.pillQuantityOrder,
          pillsSy: pill?.pillsSy || 0,
          price,
          totalPrice,
          finalAmountPackage,
          finalAmountPill,
          imageUrl,
          urgent: order.urgent,
        };
      })
    );
    
    return enrichedOrders;
  },
});

// Get Damas order by ID with enriched data
export const getById = query({
  args: { id: v.id("damasOrders") },
  handler: async (ctx, args) => {
    const damasOrder = await ctx.db.get(args.id);
    if (!damasOrder) return null;
    
    const order = await ctx.db.get(damasOrder.orderId);
    const pill = order ? await ctx.db
      .query("pills")
      .withIndex("by_substance", (q) => q.eq("substance", order.substance))
      .first() : null;
    
    let imageUrl = null;
    if (pill?.imageStorageId) {
      imageUrl = await ctx.storage.getUrl(pill.imageStorageId);
    }
    
    const finalAmountPackage = damasOrder.finalOrder + damasOrder.bonus;
    const finalAmountPill = pill?.pillsSy ? finalAmountPackage * pill.pillsSy : 0;
    const price = pill?.price || 0;
    const totalPrice = damasOrder.finalOrder * price;
    
    return {
      ...damasOrder,
      substance: order?.substance || '',
      name: pill?.name || '',
      company: pill?.company || '',
      quantityOrder: order?.pillRealOrder || 0,
      pillsSy: pill?.pillsSy || 0,
      price,
      totalPrice,
      finalAmountPackage,
      finalAmountPill,
      imageUrl,
    };
  },
});

// Update Damas order calculations
export const update = mutation({
  args: {
    id: v.id("damasOrders"),
    finalOrder: v.number(),
    bonus: v.number(),
  },
  handler: async (ctx, args) => {
    const damasOrder = await ctx.db.get(args.id);
    if (!damasOrder) throw new Error("Damas order not found");

    await ctx.db.patch(args.id, {
      finalOrder: args.finalOrder,
      bonus: args.bonus,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Confirm Damas orders and create processes
export const confirm = mutation({
  args: {},
  handler: async (ctx) => {
    const damasOrders = await ctx.db.query("damasOrders").collect();
    
    for (const damasOrder of damasOrders) {
      if (damasOrder.confirmed) continue;

      // Check if process already exists
      const existingProcess = await ctx.db
        .query("processes")
        .withIndex("by_damas_order", (q) => q.eq("damasOrderId", damasOrder._id))
        .first();

      if (!existingProcess) {
        await ctx.db.insert("processes", {
          damasOrderId: damasOrder._id,
          orderId: damasOrder.orderId,
          rowNumber: damasOrder.rowNumber,
          boxNumber: "",
          status: "ordered",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      await ctx.db.patch(damasOrder._id, {
        confirmed: true,
        updatedAt: Date.now(),
      });
    }

    return { confirmed: damasOrders.length };
  },
});

// Delete Damas order
export const remove = mutation({
  args: { id: v.id("damasOrders") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Clear all Damas orders
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const damasOrders = await ctx.db.query("damasOrders").collect();
    for (const order of damasOrders) {
      await ctx.db.delete(order._id);
    }
    return { deleted: damasOrders.length };
  },
});
