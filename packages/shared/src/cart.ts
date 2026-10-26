import type { MenuItem } from "./catalog";
import { addCents, type Cents } from "./money";

export interface CartLine {
  menuItem: MenuItem;
  quantity: number;
}

export interface Cart {
  restaurantId: string | null;
  lines: CartLine[];
}

export function createEmptyCart(): Cart {
  return { restaurantId: null, lines: [] };
}

export function belongsToDifferentRestaurant(cart: Cart, restaurantId: string): boolean {
  return cart.restaurantId !== null && cart.restaurantId !== restaurantId;
}

export function addLine(cart: Cart, menuItem: MenuItem, quantity = 1): Cart {
  if (belongsToDifferentRestaurant(cart, menuItem.restaurantId)) {
    throw new Error("Cart belongs to a different restaurant");
  }

  const existing = cart.lines.find((line) => line.menuItem.id === menuItem.id);
  const lines = existing
    ? cart.lines.map((line) =>
        line.menuItem.id === menuItem.id ? { ...line, quantity: line.quantity + quantity } : line,
      )
    : [...cart.lines, { menuItem, quantity }];

  return { restaurantId: menuItem.restaurantId, lines };
}

export function removeLine(cart: Cart, menuItemId: string): Cart {
  const lines = cart.lines.filter((line) => line.menuItem.id !== menuItemId);
  return { restaurantId: lines.length > 0 ? cart.restaurantId : null, lines };
}

export function setLineQuantity(cart: Cart, menuItemId: string, quantity: number): Cart {
  if (quantity <= 0) {
    return removeLine(cart, menuItemId);
  }
  const lines = cart.lines.map((line) =>
    line.menuItem.id === menuItemId ? { ...line, quantity } : line,
  );
  return { ...cart, lines };
}

export function cartItemCount(cart: Cart): number {
  return cart.lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartSubtotalCents(cart: Cart): Cents {
  return addCents(...cart.lines.map((line) => line.menuItem.priceCents * line.quantity));
}
