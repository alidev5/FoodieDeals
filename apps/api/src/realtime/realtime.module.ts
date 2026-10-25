import { Module } from "@nestjs/common";

import { EventsPublisher } from "./events.publisher";
import { RealtimeGateway } from "./realtime.gateway";

@Module({
  providers: [RealtimeGateway, EventsPublisher],
})
export class RealtimeModule {}
