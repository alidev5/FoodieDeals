import {
  orderRoom,
  restaurantRoom,
  SOCKET_EVENTS,
  type OrderCreatedPayload,
  type OrderStatusChangedPayload,
  type RestaurantAvailabilityChangedPayload,
} from "@foodiedeals/shared";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { RealtimeGateway } from "./realtime.gateway";

const PUBLIC_RESTAURANTS_ROOM = "restaurants";

@Injectable()
export class EventsPublisher {
  constructor(private readonly gateway: RealtimeGateway) {}

  @OnEvent("order.created")
  handleOrderCreated(payload: OrderCreatedPayload) {
    this.gateway.server.to(restaurantRoom(payload.restaurantId)).emit(SOCKET_EVENTS.orderCreated, payload);
    this.gateway.server.to(orderRoom(payload.orderId)).emit(SOCKET_EVENTS.orderStatusChanged, payload);
  }

  @OnEvent("order.status-changed")
  handleOrderStatusChanged(payload: OrderStatusChangedPayload) {
    this.gateway.server.to(orderRoom(payload.orderId)).emit(SOCKET_EVENTS.orderStatusChanged, payload);
    this.gateway.server.to(restaurantRoom(payload.restaurantId)).emit(SOCKET_EVENTS.orderStatusChanged, payload);
  }

  @OnEvent("restaurant.availability-changed")
  handleAvailabilityChanged(payload: RestaurantAvailabilityChangedPayload) {
    this.gateway.server
      .to(PUBLIC_RESTAURANTS_ROOM)
      .emit(SOCKET_EVENTS.restaurantAvailabilityChanged, payload);
  }
}
