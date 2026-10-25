import { z } from "zod";

import { orderStatusSchema } from "./schemas";

export const SOCKET_EVENTS = {
  orderCreated: "order:created",
  orderStatusChanged: "order:status-changed",
  restaurantAvailabilityChanged: "restaurant:availability-changed",
  joinOrderRoom: "join:order",
  joinRestaurantRoom: "join:restaurant",
} as const;

export function restaurantRoom(restaurantId: string): string {
  return `restaurant:${restaurantId}`;
}

export function orderRoom(orderId: string): string {
  return `order:${orderId}`;
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

export const joinOrderRoomPayloadSchema = z.object({
  orderId: z.string(),
  deviceId: z.string(),
});
export type JoinOrderRoomPayload = z.infer<typeof joinOrderRoomPayloadSchema>;

export const joinRestaurantRoomPayloadSchema = z.object({
  restaurantId: z.string(),
  demoKey: z.string(),
});
export type JoinRestaurantRoomPayload = z.infer<typeof joinRestaurantRoomPayloadSchema>;
