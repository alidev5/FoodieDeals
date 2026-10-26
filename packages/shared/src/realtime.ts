import { z } from "zod";

import { orderStatusSchema } from "./schemas";
import { sha256Hex } from "./sha256";

export const REALTIME_EVENTS = {
  orderCreated: "order:created",
  orderStatusChanged: "order:status-changed",
  restaurantAvailabilityChanged: "restaurant:availability-changed",
} as const;

/** Open/paused changes are public, so every customer listens on one shared channel. */
export const RESTAURANTS_TOPIC = "restaurants";

/**
 * Broadcast channels can't check who joins, so private channel names are derived from a
 * secret only the rightful listener holds: the restaurant's key, or the ordering device's id.
 */
export function restaurantTopic(restaurantId: string, demoKey: string): string {
  return `restaurant-${sha256Hex(`restaurant:${restaurantId}:${demoKey}`)}`;
}

export function orderTopic(orderId: string, deviceId: string): string {
  return `order-${sha256Hex(`order:${orderId}:${deviceId}`)}`;
}

export const orderCreatedPayloadSchema = z.object({
  orderId: z.string(),
  restaurantId: z.string(),
  orderNumber: z.number().int().positive(),
  status: orderStatusSchema,
});
export type OrderCreatedPayload = z.infer<typeof orderCreatedPayloadSchema>;

export const orderStatusChangedPayloadSchema = z.object({
  orderId: z.string(),
  restaurantId: z.string(),
  status: orderStatusSchema,
});
export type OrderStatusChangedPayload = z.infer<typeof orderStatusChangedPayloadSchema>;

export const restaurantAvailabilityChangedPayloadSchema = z.object({
  restaurantId: z.string(),
  isOpen: z.boolean(),
});
export type RestaurantAvailabilityChangedPayload = z.infer<
  typeof restaurantAvailabilityChangedPayloadSchema
>;
