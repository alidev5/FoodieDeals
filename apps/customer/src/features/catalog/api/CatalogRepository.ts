import type { Restaurant } from "@foodiedeals/shared";

export interface CatalogRepository {
  listRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: string): Promise<Restaurant | null>;
}
