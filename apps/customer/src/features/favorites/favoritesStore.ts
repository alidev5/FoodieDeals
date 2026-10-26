import { create } from "zustand";

interface FavoritesState {
  restaurantIds: string[];
  toggle: (restaurantId: string) => void;
}

/** Hearted restaurants for this session; not persisted or synced yet. */
export const useFavoritesStore = create<FavoritesState>((set) => ({
  restaurantIds: [],
  toggle: (restaurantId) =>
    set((state) => ({
      restaurantIds: state.restaurantIds.includes(restaurantId)
        ? state.restaurantIds.filter((id) => id !== restaurantId)
        : [...state.restaurantIds, restaurantId],
    })),
}));

export function useIsFavorite(restaurantId: string) {
  return useFavoritesStore((state) => state.restaurantIds.includes(restaurantId));
}
