import {
  joinOrderRoomPayloadSchema,
  joinRestaurantRoomPayloadSchema,
  orderRoom,
  restaurantRoom,
  SOCKET_EVENTS,
} from "@foodiedeals/shared";
import { Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";

import { assertRestaurantKey } from "../common/restaurant-key.util";
import { PrismaService } from "../prisma/prisma.service";

const PUBLIC_RESTAURANTS_ROOM = "restaurants";

@WebSocketGateway({ cors: { origin: "*" } })
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    client.join(PUBLIC_RESTAURANTS_ROOM);
  }

  @SubscribeMessage(SOCKET_EVENTS.joinOrderRoom)
  async joinOrder(@MessageBody() body: unknown, @ConnectedSocket() client: Socket) {
    const parsed = joinOrderRoomPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return { ok: false, error: "Invalid payload" };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      include: { customer: { select: { deviceId: true } } },
    });

    if (!order || order.customer.deviceId !== parsed.data.deviceId) {
      this.logger.warn(`Rejected order room join for ${parsed.data.orderId}`);
      return { ok: false, error: "Not authorized for this order" };
    }

    await client.join(orderRoom(order.id));
    return { ok: true };
  }

  @SubscribeMessage(SOCKET_EVENTS.joinRestaurantRoom)
  async joinRestaurant(@MessageBody() body: unknown, @ConnectedSocket() client: Socket) {
    const parsed = joinRestaurantRoomPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return { ok: false, error: "Invalid payload" };
    }

    try {
      await assertRestaurantKey(this.prisma, parsed.data.restaurantId, parsed.data.demoKey);
    } catch {
      return { ok: false, error: "Not authorized for this restaurant" };
    }

    await client.join(restaurantRoom(parsed.data.restaurantId));
    return { ok: true };
  }
}
