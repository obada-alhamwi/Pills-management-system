import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all pills with image URLs
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const pills = await ctx.db.query("pills").order("desc").take(1000);
    
    // Add image URLs for each pill
    const pillsWithUrls = await Promise.all(
      pills.map(async (pill) => {
        let imageUrl = null;
        if (pill.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(pill.imageStorageId);
        }
        return {
          ...pill,
          imageUrl,
        };
      })
    );
    
    return pillsWithUrls;
  },
});

// Get pill by substance
export const getBySubstance = query({
  args: { substance: v.string() },
  handler: async (ctx, args) => {
    const pill = await ctx.db
      .query("pills")
      .withIndex("by_substance", (q) => q.eq("substance", args.substance))
      .first();
    return pill;
  },
});

// Save single pill - returns duplicate flag
export const save = mutation({
  args: {
    substance: v.string(),
    name: v.string(),
    company: v.string(),
    pillsBl: v.number(),
    pillsSy: v.number(),
    price: v.number(),
    imageStorageId: v.optional(v.id("_storage")),
    currentRowId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pills")
      .withIndex("by_substance", (q) => q.eq("substance", args.substance))
      .first();

    const now = Date.now();

    if (existing) {
      // If it's the same row being edited, update it
      if (args.currentRowId && existing._id === args.currentRowId) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { currentRowId, substance, ...updateData } = args;
        await ctx.db.patch(existing._id, {
          ...updateData,
          updatedAt: now,
        });
        return { id: existing._id, action: "updated", duplicate: false };
      }
      // It's a different row with same substance - duplicate
      return { id: existing._id, action: "duplicate", duplicate: true };
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { currentRowId, ...pillData } = args;
      const id = await ctx.db.insert("pills", {
        substance: pillData.substance,
        name: pillData.name,
        company: pillData.company,
        pillsBl: pillData.pillsBl,
        pillsSy: pillData.pillsSy,
        price: pillData.price,
        imageStorageId: pillData.imageStorageId,
        createdAt: now,
        updatedAt: now,
      });
      return { id, action: "created", duplicate: false };
    }
  },
});

// Bulk save pills with duplicate checking - MUCH FASTER
export const bulkSaveWithCheck = mutation({
  args: {
    pills: v.array(
      v.object({
        substance: v.string(),
        name: v.string(),
        company: v.string(),
        pillsBl: v.number(),
        pillsSy: v.number(),
        price: v.number(),
        imageStorageId: v.optional(v.id("_storage")),
        currentRowId: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    const now = Date.now();
    let createdCount = 0;
    let updatedCount = 0;
    let duplicateCount = 0;
    const duplicateSubstances: string[] = [];

    // Get all existing pills in one query for fast lookup
    const existingPills = await ctx.db.query("pills").collect();
    const existingBySubstance = new Map();
    existingPills.forEach(pill => {
      existingBySubstance.set(pill.substance, pill);
    });

    // Track substances within this batch to detect duplicates
    const processedSubstances = new Set<string>();

    for (const pill of args.pills) {
      const substance = pill.substance.trim();
      
      // Skip empty substances
      if (!substance) continue;
      
      // Check for duplicates within the current batch
      if (processedSubstances.has(substance)) {
        duplicateCount++;
        duplicateSubstances.push(substance);
        results.push({ substance, action: "duplicate", duplicate: true, reason: "duplicate_in_batch" });
        continue;
      }
      processedSubstances.add(substance);
      
      const existing = existingBySubstance.get(substance);

      if (existing) {
        // If it's the same row being edited, update it
        if (pill.currentRowId && existing._id === pill.currentRowId) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { currentRowId, ...updateData } = pill;
          await ctx.db.patch(existing._id, {
            name: updateData.name,
            company: updateData.company,
            pillsBl: updateData.pillsBl,
            pillsSy: updateData.pillsSy,
            price: updateData.price,
            imageStorageId: updateData.imageStorageId,
            updatedAt: now,
          });
          updatedCount++;
          results.push({ id: existing._id, substance, action: "updated", duplicate: false });
        } else {
          // It's a different row with same substance - duplicate
          duplicateCount++;
          duplicateSubstances.push(substance);
          results.push({ id: existing._id, substance, action: "duplicate", duplicate: true });
        }
      } else {
        // Create new
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { currentRowId, ...insertData } = pill;
        const id = await ctx.db.insert("pills", {
          ...insertData,
          substance,
          createdAt: now,
          updatedAt: now,
        });
        createdCount++;
        results.push({ id, substance, action: "created", duplicate: false });
        // Add to map so subsequent items in batch see it
        existingBySubstance.set(substance, { _id: id, substance });
      }
    }

    return { 
      results, 
      summary: {
        created: createdCount,
        updated: updatedCount,
        duplicates: duplicateCount,
        duplicateSubstances
      }
    };
  },
});

// Delete pill and its image
export const remove = mutation({
  args: { id: v.id("pills") },
  handler: async (ctx, args) => {
    const pill = await ctx.db.get(args.id);
    
    // Delete associated image from storage if exists
    if (pill?.imageStorageId) {
      await ctx.storage.delete(pill.imageStorageId);
    }
    
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Bulk save pills (for Excel import) - skips duplicates
export const bulkSave = mutation({
  args: {
    pills: v.array(
      v.object({
        substance: v.string(),
        name: v.string(),
        company: v.string(),
        pillsBl: v.number(),
        pillsSy: v.number(),
        price: v.number(),
        imageStorageId: v.optional(v.id("_storage")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    const now = Date.now();
    const seenSubstances = new Set<string>();

    for (const pill of args.pills) {
      const substance = pill.substance.trim();
      
      // Skip empty substances
      if (!substance) continue;
      
      // Check for duplicates within the import itself
      if (seenSubstances.has(substance)) {
        results.push({ substance, action: "skipped", reason: "duplicate_in_import" });
        continue;
      }
      seenSubstances.add(substance);
      
      // Check for existing in database
      const existing = await ctx.db
        .query("pills")
        .withIndex("by_substance", (q) => q.eq("substance", substance))
        .first();

      if (existing) {
        // Update existing
        await ctx.db.patch(existing._id, {
          ...pill,
          substance,
          updatedAt: now,
        });
        results.push({ id: existing._id, substance, action: "updated" });
      } else {
        // Create new
        const id = await ctx.db.insert("pills", {
          ...pill,
          substance,
          createdAt: now,
          updatedAt: now,
        });
        results.push({ id, substance, action: "created" });
      }
    }

    return results;
  },
});

// Clear all pills and delete their images
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const pills = await ctx.db.query("pills").collect();
    
    for (const pill of pills) {
      // Delete associated image from storage if exists
      if (pill.imageStorageId) {
        await ctx.storage.delete(pill.imageStorageId);
      }
      await ctx.db.delete(pill._id);
    }
    
    return { deleted: pills.length };
  },
});
