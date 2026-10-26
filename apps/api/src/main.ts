import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import type { Env } from "./config/env.schema";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService<Env, true>);

  // The native apps don't need CORS; this lets the Expo web builds call the API during local dev.
  if (process.env.NODE_ENV !== "production") {
    app.enableCors();
  }

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle("FoodieDeals API")
    .setDescription("Pickup ordering API for FoodieDeals")
    .setVersion("0.1.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = configService.get("PORT", { infer: true });

  await app.listen(port);
  Logger.log(`FoodieDeals API listening on port ${port}`, "Bootstrap");
}

bootstrap();
