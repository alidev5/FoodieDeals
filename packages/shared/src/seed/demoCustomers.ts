export interface DemoPastOrder {
  restaurantId: string;
  items: Array<{ menuItemId: string; quantity: number }>;
  daysAgo: number;
}

export interface DemoCustomer {
  /** Fixed device id, so picking the account on any browser shows the same history. */
  deviceId: string;
  pickupName: string;
  description: string;
  pastOrders: DemoPastOrder[];
}

export const DEMO_CUSTOMERS: DemoCustomer[] = [
  {
    deviceId: "demo-customer-hamza",
    pickupName: "Hamza M.",
    description: "4 past pickups and savings",
    pastOrders: [
      {
        restaurantId: "miso-ember",
        items: [
          { menuItemId: "miso-ramen", quantity: 1 },
          { menuItemId: "crispy-pork-gyoza", quantity: 1 },
        ],
        daysAgo: 3,
      },
      {
        restaurantId: "lotus-dumpling",
        items: [
          { menuItemId: "dumpling-plate", quantity: 1 },
          { menuItemId: "scallion-pancake", quantity: 1 },
        ],
        daysAgo: 6,
      },
      {
        restaurantId: "little-napoli",
        items: [
          { menuItemId: "margherita-pizza", quantity: 1 },
          { menuItemId: "spaghetti-pomodoro", quantity: 1 },
        ],
        daysAgo: 9,
      },
      {
        restaurantId: "cedar-salt",
        items: [
          { menuItemId: "chicken-shawarma-bowl", quantity: 2 },
          { menuItemId: "pita-bread", quantity: 1 },
        ],
        daysAgo: 13,
      },
    ],
  },
  {
    deviceId: "demo-customer-sara",
    pickupName: "Sara L.",
    description: "New customer, first-visit deals",
    pastOrders: [],
  },
];
