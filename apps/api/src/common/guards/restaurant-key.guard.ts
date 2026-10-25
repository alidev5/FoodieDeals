import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";

import { PrismaService } from "../../prisma/prisma.service";
import { assertRestaurantKey } from "../restaurant-key.util";

@Injectable()
export class RestaurantKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const restaurantIdParam = request.params.restaurantId;
    const restaurantId = Array.isArray(restaurantIdParam) ? restaurantIdParam[0] : restaurantIdParam;
    const demoKeyHeader = request.header("x-restaurant-key");
    const demoKey = Array.isArray(demoKeyHeader) ? demoKeyHeader[0] : demoKeyHeader;

    await assertRestaurantKey(this.prisma, restaurantId, demoKey);
    return true;
  }
}
