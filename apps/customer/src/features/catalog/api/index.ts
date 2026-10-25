import { API_URL } from "../../../lib/apiUrl";

import type { CatalogRepository } from "./CatalogRepository";
import { HttpCatalogRepository } from "./HttpCatalogRepository";

export type { CatalogRepository } from "./CatalogRepository";
export { HttpCatalogRepository } from "./HttpCatalogRepository";

export const catalogRepository: CatalogRepository = new HttpCatalogRepository(API_URL);
