import { z } from "zod";

export const dealTypeSchema = z.enum(["BOGO", "PERCENT_OFF", "FREE_ITEM", "FIXED_PRICE_BUNDLE"]);
export type DealType = z.infer<typeof dealTypeSchema>;

export const timeWindowSchema = z.object({
  startMinute: z.number().int().min(0).max(1440),
  endMinute: z.number().int().min(0).max(1440),
});
export type TimeWindow = z.infer<typeof timeWindowSchema>;

export const dealConditionsSchema = z.object({
  minSubtotalCents: z.number().int().nonnegative().optional(),
  timeWindow: timeWindowSchema.optional(),
  firstVisitOnly: z.boolean().optional(),
  eligibleItemIds: z.array(z.string()).optional(),
});
export type DealConditions = z.infer<typeof dealConditionsSchema>;

const dealBaseSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  name: z.string(),
  conditions: dealConditionsSchema,
});

export const dealSchema = z.discriminatedUnion("type", [
  dealBaseSchema.extend({
    type: z.literal("BOGO"),
    eligibleItemIds: z.array(z.string()),
  }),
  dealBaseSchema.extend({
    type: z.literal("PERCENT_OFF"),
    percent: z.number().positive().max(100),
  }),
  dealBaseSchema.extend({
    type: z.literal("FREE_ITEM"),
    freeItemId: z.string(),
  }),
  dealBaseSchema.extend({
    type: z.literal("FIXED_PRICE_BUNDLE"),
    eligibleItemIds: z.array(z.string()),
    bundleSize: z.number().int().positive(),
    bundlePriceCents: z.number().int().nonnegative(),
  }),
]);
export type Deal = z.infer<typeof dealSchema>;

export const menuItemSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  priceCents: z.number().int().positive(),
  photo: z.string().optional(),
});
export type MenuItem = z.infer<typeof menuItemSchema>;

export const restaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  demoKey: z.string(),
  isOpen: z.boolean(),
  cuisine: z.string(),
  heroPhoto: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  menu: z.array(menuItemSchema),
  deals: z.array(dealSchema),
});
export type Restaurant = z.infer<typeof restaurantSchema>;
