import type { Customer, Order, OrderItem, Restaurant } from "@prisma/client";

type OrderWithRelations = Order & {
  items: OrderItem[];
  restaurant: Pick<
    Restaurant,
    "name" | "address" | "phone" | "heroPhoto" | "prepMinutesMin" | "prepMinutesMax"
  >;
  customer: Pick<Customer, "pickupName" | "deviceId">;
};

export function toOrderResponse(order: OrderWithRelations) {
  return {
    id: order.id,
    restaurantId: order.restaurantId,
    orderNumber: order.orderNumber,
    status: order.status,
    pickupName: order.customer.pickupName,
    createdAt: order.createdAt.toISOString(),
    acceptedAt: order.acceptedAt?.toISOString() ?? null,
    readyAt: order.readyAt?.toISOString() ?? null,
    pickedUpAt: order.pickedUpAt?.toISOString() ?? null,
    paidOutAt: order.paidOutAt?.toISOString() ?? null,
    items: order.items.map((item) => ({
      name: item.name,
      priceCents: item.priceCents,
      quantity: item.quantity,
      menuItemId: item.menuItemId,
    })),
    appliedDealId: order.appliedDealId,
    appliedDealName: order.appliedDealName,
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    taxCents: order.taxCents,
    totalCents: order.totalCents,
    platformFeeCents: order.platformFeeCents,
    restaurantReceivesCents: order.restaurantReceivesCents,
    restaurant: {
      name: order.restaurant.name,
      address: order.restaurant.address,
      phone: order.restaurant.phone,
      heroPhoto: order.restaurant.heroPhoto,
      prepMinutesMin: order.restaurant.prepMinutesMin,
      prepMinutesMax: order.restaurant.prepMinutesMax,
    },
  };
}

export type OrderResponse = ReturnType<typeof toOrderResponse>;
