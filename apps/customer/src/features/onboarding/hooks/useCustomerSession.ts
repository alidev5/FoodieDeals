import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";

import { setDeviceId } from "../../../lib/deviceId";
import { writeStoredValue } from "../../../lib/secureStorage";
import { useCartStore } from "../../cart/store";

import { PICKUP_NAME_KEY, PICKUP_NAME_QUERY_KEY } from "./usePickupName";

export interface SignInInput {
  pickupName: string;
  /** A demo account's fixed device id; omitted for a fresh customer. */
  deviceId?: string;
}

/** Identity is a pickup name plus a device id, so "signing in" just stores both. */
export function useSignIn() {
  const queryClient = useQueryClient();
  const clearCart = useCartStore((state) => state.clearCart);

  return useMutation({
    mutationFn: async ({ pickupName, deviceId }: SignInInput) => {
      const resolvedDeviceId = deviceId ?? Crypto.randomUUID();
      await Promise.all([
        writeStoredValue(PICKUP_NAME_KEY, pickupName),
        setDeviceId(resolvedDeviceId),
      ]);
      return { pickupName, deviceId: resolvedDeviceId };
    },
    onSuccess: ({ pickupName, deviceId }) => {
      clearCart();
      queryClient.setQueryData(["device-id"], deviceId);
      queryClient.setQueryData(PICKUP_NAME_QUERY_KEY, pickupName);
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const clearCart = useCartStore((state) => state.clearCart);

  return useMutation({
    mutationFn: () => writeStoredValue(PICKUP_NAME_KEY, ""),
    onSuccess: () => {
      clearCart();
      queryClient.setQueryData(PICKUP_NAME_QUERY_KEY, "");
    },
  });
}
