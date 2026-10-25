import { canTransition, type OrderStatus } from "@foodiedeals/shared";
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";

import type { PaymentIntentMetadata } from "../checkout/payment-intent-metadata";
import { assertRestaurantKey } from "../common/restaurant-key.util";
import { PrismaService } from "../prisma/prisma.service";

import type { OrderActionDto } from "./orders.dto";
import { toOrderResponse, type OrderResponse } from "./orders.mapper";

const ORDER_INCLUDE = {
  items: true,
  restaurant: { select: { name: true, address: true, phone: true } },
  customer: { select: { pickupName: true, deviceId: true } },
} as const;

const ACTION_TO_STATUS: Record<OrderActionDto["action"], OrderStatus> = {
  ACCEPT: "ACCEPTED",
  MARK_READY: "READY",
  PICKED_UP: "PICKED_UP",
};

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createFromPaymentIntent(
    stripeEventId: string,
    paymentIntentId: string,
    metadata: PaymentIntentMetadata,
  ): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.processedStripeEvent.create({
          data: { id: stripeEventId, type: "payment_intent.succeeded" },
        });

        const customer = await tx.customer.upsert({
          where: { deviceId: metadata.deviceId },
          create: { deviceId: metadata.deviceId, pickupName: metadata.pickupName },
          update: { pickupName: metadata.pickupName },
        });

        const orderDate = startOfUtcDay(new Date());
        const counter = await tx.dailyOrderCounter.upsert({
          where: { restaurantId_date: { restaurantId: metadata.restaurantId, date: orderDate } },
          create: { restaurantId: metadata.restaurantId, date: orderDate, lastNumber: 1 },
          update: { lastNumber: { increment: 1 } },
        });

        await tx.order.create({
          data: {
            restaurantId: metadata.restaurantId,
            customerId: customer.id,
            orderNumber: counter.lastNumber,
            orderDate,
            status: "WAITING",
            subtotalCents: metadata.subtotalCents,
            discountCents: metadata.discountCents,
            taxCents: metadata.taxCents,
            totalCents: metadata.totalCents,
            platformFeeCents: metadata.platformFeeCents,
            restaurantReceivesCents: metadata.restaurantReceivesCents,
            appliedDealId: metadata.appliedDealId || null,
            appliedDealName: metadata.appliedDealName || null,
            stripePaymentIntentId: paymentIntentId,
            items: {
              create: metadata.items.map((item) => ({
                menuItemId: item.menuItemId,
                name: item.name,
                priceCents: item.priceCents,
                quantity: item.quantity,
              })),
            },
          },
        });

        await tx.checkoutSession.updateMany({
          where: { stripePaymentIntentId: paymentIntentId },
          data: { status: "succeeded" },
        });
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        return;
      }
      throw error;
    }

    const created = await this.prisma.order.findUnique({ where: { stripePaymentIntentId: paymentIntentId } });
    if (created) {
      this.eventEmitter.emit("order.created", {
        orderId: created.id,
        restaurantId: created.restaurantId,
        orderNumber: created.orderNumber,
        status: created.status,
      });
    }
  }

  async markPaymentFailed(stripeEventId: string, paymentIntentId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.processedStripeEvent.create({
          data: { id: stripeEventId, type: "payment_intent.payment_failed" },
        });
        await tx.checkoutSession.updateMany({
          where: { stripePaymentIntentId: paymentIntentId },
          data: { status: "failed" },
        });
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        return;
      }
      throw error;
    }
  }

  async getById(orderId: string, deviceId: string): Promise<OrderResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    if (order.customer.deviceId !== deviceId) {
      throw new ForbiddenException("This order does not belong to this device");
    }

    return toOrderResponse(order);
  }

  async getByPaymentIntentId(paymentIntentId: string): Promise<OrderResponse | null> {
    const order = await this.prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: ORDER_INCLUDE,
    });

    return order ? toOrderResponse(order) : null;
  }

  async listForRestaurant(restaurantId: string, status?: OrderStatus): Promise<OrderResponse[]> {
    const orders = await this.prisma.order.findMany({
      where: { restaurantId, ...(status ? { status } : {}) },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return orders.map(toOrderResponse);
  }

  async getStats(restaurantId: string) {
    const today = startOfUtcDay(new Date());

    const [active, ready, completedToday, revenueToday] = await Promise.all([
      this.prisma.order.count({ where: { restaurantId, status: { in: ["WAITING", "ACCEPTED"] } } }),
      this.prisma.order.count({ where: { restaurantId, status: "READY" } }),
      this.prisma.order.count({ where: { restaurantId, status: "PICKED_UP", orderDate: today } }),
      this.prisma.order.aggregate({
        where: { restaurantId, status: "PICKED_UP", orderDate: today },
        _sum: { restaurantReceivesCents: true },
      }),
    ]);

    return {
      active,
      ready,
      completedToday,
      revenueTodayCents: revenueToday._sum.restaurantReceivesCents ?? 0,
    };
  }

  async applyAction(orderId: string, action: OrderActionDto["action"], demoKey: string | undefined) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    await assertRestaurantKey(this.prisma, order.restaurantId, demoKey);

    const target = ACTION_TO_STATUS[action];
    if (!canTransition(order.status, target)) {
      throw new ConflictException(`Cannot move order from ${order.status} to ${target}`);
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: target },
      include: ORDER_INCLUDE,
    });

    this.eventEmitter.emit("order.status-changed", {
      orderId: updated.id,
      restaurantId: updated.restaurantId,
      status: updated.status,
    });

    return toOrderResponse(updated);
  }

  async setAvailability(restaurantId: string, isOpen: boolean) {
    await this.prisma.restaurant.update({ where: { id: restaurantId }, data: { isOpen } });

    this.eventEmitter.emit("restaurant.availability-changed", { restaurantId, isOpen });

    return { restaurantId, isOpen };
  }
}
