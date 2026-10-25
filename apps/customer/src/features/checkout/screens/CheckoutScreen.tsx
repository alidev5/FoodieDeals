import { formatCents } from "@foodiedeals/shared";
import { Button, Card, Text, useTheme } from "@foodiedeals/ui-native";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDeviceId } from "../../../lib/useDeviceId";
import { useCartLines, useCartStore } from "../../cart/store";
import { usePickupName } from "../../onboarding/hooks/usePickupName";
import { DealList } from "../components/DealList";
import { PriceSummary } from "../components/PriceSummary";
import { usePayment } from "../hooks/usePayment";
import { useQuote } from "../hooks/useQuote";

export function CheckoutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const lines = useCartLines();
  const cart = useCartStore((state) => state.cart);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const quote = useQuote();
  const { data: pickupName } = usePickupName();
  const { data: deviceId } = useDeviceId();
  const { pay, status, error } = usePayment();

  const isBusy = status === "processing" || status === "confirming";

  const handlePay = async () => {
    if (!cart.restaurantId || !pickupName || !deviceId) return;

    const orderId = await pay({
      restaurantId: cart.restaurantId,
      deviceId,
      pickupName,
      items: lines.map((line) => ({ menuItemId: line.menuItem.id, quantity: line.quantity })),
    });

    if (orderId) {
      clearCart();
      router.replace(`/pickup?orderId=${orderId}`);
    } else if (error) {
      Alert.alert("Payment failed", error);
    }
  };

  if (lines.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: theme.spacing.xl }}>
          <Text variant="heading" color="secondary">
            Your cart is empty
          </Text>
          <Button label="Browse restaurants" variant="dark" onPress={() => router.replace("/home")} style={{ marginTop: theme.spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Text variant="title">Checkout</Text>

        <View style={{ gap: theme.spacing.sm }}>
          {lines.map((line) => (
            <Card key={line.menuItem.id} padding="md">
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text variant="body">{line.menuItem.name}</Text>
                  <Text variant="caption" color="secondary">
                    {formatCents(line.menuItem.priceCents)} each
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
                  <Button
                    label="-"
                    variant="outline"
                    onPress={() => setQuantity(line.menuItem.id, line.quantity - 1)}
                    style={{ paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs }}
                  />
                  <Text variant="body">{line.quantity}</Text>
                  <Button
                    label="+"
                    variant="outline"
                    onPress={() => setQuantity(line.menuItem.id, line.quantity + 1)}
                    style={{ paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs }}
                  />
                </View>
              </View>
            </Card>
          ))}
        </View>

        {quote ? (
          <>
            <DealList evaluations={quote.dealEvaluations} appliedDealId={quote.appliedDeal?.dealId ?? null} />
            <Card padding="lg">
              <PriceSummary quote={quote} />
            </Card>
          </>
        ) : null}

        {status === "confirming" ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, justifyContent: "center" }}>
            <ActivityIndicator color={theme.color.accent} />
            <Text variant="body" color="secondary">
              Confirming payment
            </Text>
          </View>
        ) : (
          <Button
            label={quote ? `Pay ${formatCents(quote.totalCents)}` : "Pay"}
            variant="accent"
            disabled={isBusy || !quote}
            onPress={handlePay}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
