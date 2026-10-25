import { Button, Sheet, Text, useTheme } from "@foodiedeals/ui-native";
import { View } from "react-native";

import { useCartStore, usePendingAddition } from "../store";

export function StartNewOrderSheet() {
  const theme = useTheme();
  const pendingAddition = usePendingAddition();
  const confirmStartNewOrder = useCartStore((state) => state.confirmStartNewOrder);
  const cancelStartNewOrder = useCartStore((state) => state.cancelStartNewOrder);

  return (
    <Sheet visible={pendingAddition !== null} onDismiss={cancelStartNewOrder}>
      <View style={{ gap: theme.spacing.lg }}>
        <Text variant="title">Start a new order?</Text>
        <Text variant="body" color="secondary">
          Your cart has items from another restaurant. One order can only come from one
          restaurant.
        </Text>
        <View style={{ gap: theme.spacing.sm }}>
          <Button label="Start new order" variant="accent" onPress={confirmStartNewOrder} />
          <Button label="Keep current cart" variant="outline" onPress={cancelStartNewOrder} />
        </View>
      </View>
    </Sheet>
  );
}
