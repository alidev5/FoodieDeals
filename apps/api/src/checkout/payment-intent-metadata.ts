import { z } from "zod";

export const orderLineMetadataSchema = z.object({
  menuItemId: z.string(),
  name: z.string(),
  priceCents: z.number().int(),
  quantity: z.number().int().positive(),
});
export type OrderLineMetadata = z.infer<typeof orderLineMetadataSchema>;

export const paymentIntentMetadataSchema = z.object({
  restaurantId: z.string(),
  deviceId: z.string(),
  pickupName: z.string(),
  items: z.string().transform((value) => orderLineMetadataSchema.array().parse(JSON.parse(value))),
  subtotalCents: z.coerce.number().int(),
  discountCents: z.coerce.number().int(),
  taxCents: z.coerce.number().int(),
  totalCents: z.coerce.number().int(),
  platformFeeCents: z.coerce.number().int(),
  restaurantReceivesCents: z.coerce.number().int(),
  appliedDealId: z.string(),
  appliedDealName: z.string(),
});
export type PaymentIntentMetadata = z.infer<typeof paymentIntentMetadataSchema>;

export function encodePaymentIntentMetadata(metadata: {
  restaurantId: string;
  deviceId: string;
  pickupName: string;
  items: OrderLineMetadata[];
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  platformFeeCents: number;
  restaurantReceivesCents: number;
  appliedDealId: string;
  appliedDealName: string;
}): Record<string, string> {
  return {
    restaurantId: metadata.restaurantId,
    deviceId: metadata.deviceId,
    pickupName: metadata.pickupName,
    items: JSON.stringify(metadata.items),
    subtotalCents: String(metadata.subtotalCents),
    discountCents: String(metadata.discountCents),
    taxCents: String(metadata.taxCents),
    totalCents: String(metadata.totalCents),
    platformFeeCents: String(metadata.platformFeeCents),
    restaurantReceivesCents: String(metadata.restaurantReceivesCents),
    appliedDealId: metadata.appliedDealId,
    appliedDealName: metadata.appliedDealName,
  };
}
