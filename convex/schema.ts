import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users and authentication
  users: defineTable({
    username: v.string(),
    password: v.string(),
    pages: v.array(v.string()),
  }).index("by_username", ["username"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    createdAt: v.number(),
  }).index("by_token", ["token"]),

  // Pills/Substances inventory (Data Page) - Master data
  pills: defineTable({
    substance: v.string(),
    name: v.string(),
    company: v.string(),
    pillsBl: v.number(), // Num of Pills BL
    pillsSy: v.number(), // Num of Pills SY
    price: v.number(),
    imageStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_substance", ["substance"]),

  // Orders (Order Page) - References pills by substance
  orders: defineTable({
    rowNumber: v.number(),
    substance: v.string(), // References pills.substance
    currentBalance: v.number(), // pack_c
    quantityOrder: v.number(), // pack_order
    realOrder: v.number(), // pack_r_order
    finalBalance: v.number(), // pack_f
    pillQuantityOrder: v.number(),
    pillRealOrder: v.number(),
    urgent: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_substance", ["substance"])
    .index("by_rowNumber", ["rowNumber"]),

  // Damas processing (Damas Page) - References orders
  damasOrders: defineTable({
    orderId: v.id("orders"),
    rowNumber: v.number(),
    finalOrder: v.number(), // finall_order (user input)
    bonus: v.number(),
    confirmed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_order", ["orderId"])
    .index("by_rowNumber", ["rowNumber"]),

  // Process tracking (Process Page) - References damasOrders
  processes: defineTable({
    damasOrderId: v.id("damasOrders"),
    orderId: v.id("orders"),
    rowNumber: v.number(),
    boxNumber: v.string(),
    status: v.union(
      v.literal("ordered"),
      v.literal("preparing"),
      v.literal("out_for_delivery"),
      v.literal("in_transit")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_damas_order", ["damasOrderId"])
    .index("by_order", ["orderId"])
    .index("by_rowNumber", ["rowNumber"]),

  // Cost calculations (Cost Page) - References processes
  costs: defineTable({
    processId: v.id("processes"),
    damasOrderId: v.id("damasOrders"),
    rowNumber: v.number(),
    createdAt: v.number(),
  }).index("by_process", ["processId"])
    .index("by_damas_order", ["damasOrderId"]),

  // Completed orders bundle (Last Order Page) - Stores full snapshot
  lastOrderBundles: defineTable({
    bundleId: v.string(),
    processes: v.any(), // Store full process data snapshot
    damasOrders: v.any(), // Store full damasOrder data snapshot
    orders: v.any(), // Store full order data snapshot
    totalCost: v.number(),
    createdAt: v.number(),
    createdBy: v.string(),
  }).index("by_bundle_id", ["bundleId"]),
});
