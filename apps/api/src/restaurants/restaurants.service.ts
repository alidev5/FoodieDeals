import type { DealType, Restaurant } from "@foodiedeals/shared";
import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import { toSharedRestaurant } from "./restaurants.mapper";

const RESTAURANT_INCLUDE = { menuItems: true, deals: true } as const;

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(dealType?: DealType): Promise<Restaurant[]> {
    const rows = await this.prisma.restaurant.findMany({
      where: dealType ? { deals: { some: { type: dealType } } } : undefined,
      include: RESTAURANT_INCLUDE,
      orderBy: { name: "asc" },
    });

    return rows.map(toSharedRestaurant);
  }

  async getById(id: string): Promise<Restaurant | null> {
    const row = await this.prisma.restaurant.findUnique({
      where: { id },
      include: RESTAURANT_INCLUDE,
    });

    return row ? toSharedRestaurant(row) : null;
  }
}
