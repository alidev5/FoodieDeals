import {
  orderTopic,
  REALTIME_EVENTS,
  restaurantTopic,
  RESTAURANTS_TOPIC,
  type OrderCreatedPayload,
  type OrderStatusChangedPayload,
  type RestaurantAvailabilityChangedPayload,
} from "@foodiedeals/shared";

export interface RealtimeMessage {
  topic: string;
  event: string;
  payload: object;
}

export interface RealtimeSender {
  send(messages: RealtimeMessage[]): Promise<void>;
}

/** Without Supabase (plain docker-compose), the apps fall back to polling, so nothing is sent. */
export const noopRealtimeSender: RealtimeSender = { send: async () => {} };

/** Supabase Realtime's REST broadcast endpoint; one request delivers to every subscriber. */
export function createSupabaseRealtimeSender(supabaseUrl: string, apiKey: string): RealtimeSender {
  return {
    async send(messages) {
      const response = await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ messages }),
      });
      if (!response.ok) {
        console.error(`Realtime broadcast failed: ${response.status} ${await response.text()}`);
      }
    },
  };
}

interface OrderAudience {
  demoKey: string;
  deviceId: string;
}

/** Fans each domain event out to the channels the restaurant and the customer listen on. */
export function createRealtimePublisher(sender: RealtimeSender) {
  const publish = (messages: RealtimeMessage[]) =>
    sender.send(messages).catch((error: unknown) => {
      console.error("Realtime broadcast failed", error);
    });

  return {
    orderCreated(payload: OrderCreatedPayload, audience: OrderAudience) {
      return publish([
        {
          topic: restaurantTopic(payload.restaurantId, audience.demoKey),
          event: REALTIME_EVENTS.orderCreated,
          payload,
        },
        {
          topic: orderTopic(payload.orderId, audience.deviceId),
          event: REALTIME_EVENTS.orderStatusChanged,
          payload,
        },
      ]);
    },

    orderStatusChanged(payload: OrderStatusChangedPayload, audience: OrderAudience) {
      return publish([
        {
          topic: orderTopic(payload.orderId, audience.deviceId),
          event: REALTIME_EVENTS.orderStatusChanged,
          payload,
        },
        {
          topic: restaurantTopic(payload.restaurantId, audience.demoKey),
          event: REALTIME_EVENTS.orderStatusChanged,
          payload,
        },
      ]);
    },

    availabilityChanged(payload: RestaurantAvailabilityChangedPayload) {
      return publish([
        {
          topic: RESTAURANTS_TOPIC,
          event: REALTIME_EVENTS.restaurantAvailabilityChanged,
          payload,
        },
      ]);
    },
  };
}

export type RealtimePublisher = ReturnType<typeof createRealtimePublisher>;
