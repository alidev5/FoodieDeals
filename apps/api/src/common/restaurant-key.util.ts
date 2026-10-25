import { UnauthorizedException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

export async function assertRestaurantKey(
  prisma: PrismaService,
  restaurantId: string | undefined,
  demoKey: string | undefined,
): Promise<void> {
  if (!restaurantId || !demoKey) {
    throw new UnauthorizedException("Missing restaurant credentials");
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { demoKey: true },
  });

  if (!restaurant || restaurant.demoKey !== demoKey) {
    throw new UnauthorizedException("Invalid restaurant credentials");
  }
}
