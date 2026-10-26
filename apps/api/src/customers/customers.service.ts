import { Injectable } from "@nestjs/common";
import type { Customer } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

import type { CreateCustomerDto } from "./customers.dto";

const RECENT_RESTAURANT_LIMIT = 6;

function startOfUtcMonth(date: Date, monthOffset = 0): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + monthOffset, 1));
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(dto: CreateCustomerDto): Promise<Customer> {
    return this.prisma.customer.upsert({
      where: { deviceId: dto.deviceId },
      create: { deviceId: dto.deviceId, pickupName: dto.pickupName },
      update: { pickupName: dto.pickupName },
    });
  }

  async getSummary(deviceId: string) {
    const now = new Date();
    const thisMonth = startOfUtcMonth(now);
    const lastMonth = startOfUtcMonth(now, -1);

    const [orders, recent] = await Promise.all([
      this.prisma.order.findMany({
        where: { customer: { deviceId }, createdAt: { gte: lastMonth } },
        select: { discountCents: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.order.findMany({
        where: { customer: { deviceId } },
        orderBy: { createdAt: "desc" },
        distinct: ["restaurantId"],
        take: RECENT_RESTAURANT_LIMIT,
        select: { id: true, restaurantId: true, createdAt: true },
      }),
    ]);

    const thisMonthOrders = orders.filter((order) => order.createdAt >= thisMonth);
    const lastMonthOrders = orders.filter((order) => order.createdAt < thisMonth);

    return {
      savedThisMonthCents: thisMonthOrders.reduce((sum, order) => sum + order.discountCents, 0),
      savedLastMonthCents: lastMonthOrders.reduce((sum, order) => sum + order.discountCents, 0),
      pickupsThisMonth: thisMonthOrders.length,
      savingsThisMonthCents: thisMonthOrders.map((order) => order.discountCents),
      recentRestaurants: recent.map((order) => ({
        restaurantId: order.restaurantId,
        lastOrderId: order.id,
        lastOrderedAt: order.createdAt.toISOString(),
      })),
    };
  }
}
