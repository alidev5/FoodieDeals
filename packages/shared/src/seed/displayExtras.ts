/**
 * Static display data for the demo restaurants, matching the design mockups.
 * None of this is backed by a real source yet (there are no reviews, no
 * customer location and no menu categories in the schema), so it lives here
 * as fixed values keyed by seed id rather than in the database.
 */

export interface RestaurantDisplayExtras {
  rating: number;
  ratingCount: number;
  distanceMiles: number;
  walkMinutes: number;
  photoCount: number;
  /** Shown on the card while the restaurant is paused, e.g. "2:00 PM". */
  pausedUntil?: string;
  /** Menu sections in display order; "Popular" collects items flagged popular. */
  menuCategories: string[];
}

export interface MenuItemDisplayExtras {
  category: string;
  /** Shows the "Most ordered" tag and lists the item under Popular. */
  mostOrdered?: boolean;
  /** Short detail shown on checkout lines, e.g. "6 pieces". */
  detail?: string;
}

/** The pickup area shown in the customer app header. */
export const DEMO_PICKUP_AREA = "Flushing, Queens";

export const RESTAURANT_DISPLAY_EXTRAS: Record<string, RestaurantDisplayExtras> = {
  "miso-ember": {
    rating: 4.8,
    ratingCount: 1284,
    distanceMiles: 0.2,
    walkMinutes: 4,
    photoCount: 24,
    menuCategories: ["Popular", "Ramen", "Noodles", "Sides", "Desserts"],
  },
  "lotus-dumpling": {
    rating: 4.7,
    ratingCount: 1312,
    distanceMiles: 0.3,
    walkMinutes: 6,
    photoCount: 31,
    menuCategories: ["Popular", "Dumplings", "Noodles", "Small plates", "Soups"],
  },
  "little-napoli": {
    rating: 4.6,
    ratingCount: 860,
    distanceMiles: 0.5,
    walkMinutes: 10,
    photoCount: 18,
    menuCategories: ["Popular", "Pizza", "Pasta", "Sides", "Desserts"],
  },
  "cedar-salt": {
    rating: 4.6,
    ratingCount: 540,
    distanceMiles: 0.6,
    walkMinutes: 12,
    photoCount: 15,
    menuCategories: ["Popular", "Bowls", "Plates", "Salads", "Sides"],
  },
  "taro-cloud": {
    rating: 4.9,
    ratingCount: 2104,
    distanceMiles: 0.3,
    walkMinutes: 6,
    photoCount: 42,
    pausedUntil: "2:00 PM",
    menuCategories: ["Popular", "Milk tea", "Lattes", "Desserts"],
  },
};

export const MENU_ITEM_DISPLAY_EXTRAS: Record<string, MenuItemDisplayExtras> = {
  "miso-ramen": { category: "Ramen", mostOrdered: true, detail: "Most ordered" },
  "crispy-pork-gyoza": { category: "Sides", mostOrdered: true, detail: "6 pieces" },
  "chili-sesame-noodles": { category: "Noodles", mostOrdered: true },
  "matcha-cheesecake": { category: "Desserts", mostOrdered: true },
  "spicy-tantan-ramen": { category: "Ramen", detail: "Spicy" },
  "yuzu-cold-soba": { category: "Noodles", detail: "Served cold" },
  "chicken-karaage-gyoza": { category: "Sides", detail: "6 pieces" },

  "pork-chive-dumplings": { category: "Dumplings", mostOrdered: true, detail: "8 pieces" },
  "shrimp-dumplings": { category: "Dumplings", detail: "8 pieces" },
  "dumpling-plate": { category: "Dumplings", mostOrdered: true, detail: "12 pieces" },
  "scallion-pancake": { category: "Small plates" },
  "hot-sour-soup": { category: "Soups" },
  "chili-oil-wontons": { category: "Dumplings", mostOrdered: true, detail: "10 pieces" },
  "dan-dan-noodles": { category: "Noodles", detail: "Spicy" },

  "margherita-pizza": { category: "Pizza", mostOrdered: true },
  "garlic-knots": { category: "Sides", mostOrdered: true, detail: "6 knots" },
  "spaghetti-pomodoro": { category: "Pasta" },
  "caesar-salad": { category: "Sides" },
  "pepperoni-pizza": { category: "Pizza", mostOrdered: true },
  "vodka-rigatoni": { category: "Pasta", detail: "Spicy" },
  tiramisu: { category: "Desserts" },

  "chicken-shawarma-bowl": { category: "Bowls", mostOrdered: true },
  "falafel-bowl": { category: "Bowls", mostOrdered: true },
  hummus: { category: "Sides" },
  "pita-bread": { category: "Sides" },
  "lamb-kofta-plate": { category: "Plates", mostOrdered: true },
  "fattoush-salad": { category: "Salads" },

  "taro-milk-tea": { category: "Milk tea", mostOrdered: true },
  "brown-sugar-boba": { category: "Milk tea", mostOrdered: true },
  "matcha-latte": { category: "Lattes" },
  "strawberry-matcha": { category: "Lattes" },
  "mango-pomelo-sago": { category: "Desserts" },
};

const DEFAULT_RESTAURANT_EXTRAS: RestaurantDisplayExtras = {
  rating: 4.5,
  ratingCount: 120,
  distanceMiles: 0.5,
  walkMinutes: 10,
  photoCount: 8,
  menuCategories: ["Popular", "Menu"],
};

export function restaurantDisplayExtras(restaurantId: string): RestaurantDisplayExtras {
  return RESTAURANT_DISPLAY_EXTRAS[restaurantId] ?? DEFAULT_RESTAURANT_EXTRAS;
}

export function menuItemDisplayExtras(menuItemId: string): MenuItemDisplayExtras {
  return MENU_ITEM_DISPLAY_EXTRAS[menuItemId] ?? { category: "Menu" };
}

/** 1284 -> "1,284", used under the rating on the restaurant page. */
export function formatRatingCountLong(count: number): string {
  return count.toLocaleString("en-US");
}

/** 1284 -> "1.3k", 860 -> "860", used on cards. */
export function formatRatingCountShort(count: number): string {
  return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
}
