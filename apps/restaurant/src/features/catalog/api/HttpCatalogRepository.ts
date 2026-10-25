import { restaurantSchema, type Restaurant } from "@foodiedeals/shared";
import { createApiClient } from "@foodiedeals/ui-native";
import { z } from "zod";

import type { CatalogRepository } from "./CatalogRepository";

export class HttpCatalogRepository implements CatalogRepository {
  private readonly client: ReturnType<typeof createApiClient>;

  constructor(baseUrl: string) {
    this.client = createApiClient(baseUrl);
  }

  async listRestaurants(): Promise<Restaurant[]> {
    const data = await this.client.get<unknown>("/restaurants");
    return z.array(restaurantSchema).parse(data);
  }
}
