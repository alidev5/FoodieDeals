import { z } from "zod";

export const checkoutItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().positive(),
});

export const quoteRequestSchema = z.object({
  restaurantId: z.string(),
  deviceId: z.string(),
  items: z.array(checkoutItemSchema).min(1),
});
export type QuoteRequestDto = z.infer<typeof quoteRequestSchema>;

export const createPaymentIntentRequestSchema = quoteRequestSchema.extend({
  pickupName: z.string().min(1).max(80),
});
export type CreatePaymentIntentRequestDto = z.infer<typeof createPaymentIntentRequestSchema>;
