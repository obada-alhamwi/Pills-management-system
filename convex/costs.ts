import { query, mutation } from "./_generated/server";

// Get all costs from damasOrders (like static version loads from damasData)
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const damasOrders = await ctx.db.query("damasOrders").order("asc").take(1000);
    
    const enrichedCosts = await Promise.all(
      damasOrders.map(async (damasOrder) => {
        const order = await ctx.db.get(damasOrder.orderId);
        
        if (!order) {
          return null;
        }
        
        const pill = await ctx.db
          .query("pills")
          .withIndex("by_substance", (q) => q.eq("substance", order.substance))
          .first();
        
        const finalAmountPackage = damasOrder.finalOrder + damasOrder.bonus;
        const price = pill?.price || 0;
        const totalPrice = damasOrder.finalOrder * price;
        
        const baseAmount = damasOrder.finalOrder;
        const bonusPercentage = baseAmount > 0 ? (damasOrder.bonus / baseAmount) * 100 : 0;
        
        return {
          _id: damasOrder._id,
          rowNumber: damasOrder.rowNumber,
          substance: order.substance,
          name: pill?.name || '',
          company: pill?.company || '',
          finalAmountPackage,
          bonus: damasOrder.bonus,
          bonusPercentage: parseFloat(bonusPercentage.toFixed(2)),
          price,
          totalPrice,
          urgent: order.urgent || false,
        };
      })
    );
    
    return enrichedCosts.filter((c): c is NonNullable<typeof c> => c !== null);
  },
});

// Get total cost from damasOrders
export const getTotal = query({
  args: {},
  handler: async (ctx) => {
    const damasOrders = await ctx.db.query("damasOrders").collect();
    
    let total = 0;
    for (const damasOrder of damasOrders) {
      const order = await ctx.db.get(damasOrder.orderId);
      if (order) {
        const pill = await ctx.db
          .query("pills")
          .withIndex("by_substance", (q) => q.eq("substance", order.substance))
          .first();
        const price = pill?.price || 0;
        total += damasOrder.finalOrder * price;
      }
    }
    
    return { total, count: damasOrders.length };
  },
});

// Clear all costs
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const costs = await ctx.db.query("costs").collect();
    for (const cost of costs) {
      await ctx.db.delete(cost._id);
    }
    return { deleted: costs.length };
  },
});
