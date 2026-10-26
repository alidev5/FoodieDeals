import {
  formatCents,
  menuItemDisplayExtras,
  restaurantDisplayExtras,
  type DealType,
} from "@foodiedeals/shared";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  InlineAlert,
  Text,
  useTheme,
} from "@foodiedeals/ui-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "../../../components/ScreenHeader";
import { streetAddress } from "../../../lib/display";
import { resolveFoodPhoto } from "../../../lib/foodPhotos";
import { IS_STRIPE_TEST_MODE } from "../../../lib/stripeKey";
import { useDeviceId } from "../../../lib/useDeviceId";
import { useCartLines, useCartStore } from "../../cart/store";
import { useRestaurant } from "../../catalog/hooks";
import { usePickupName } from "../../onboarding/hooks/usePickupName";
import { DealList } from "../components/DealList";
import { PaymentCardForm } from "../components/PaymentCardForm";
import { PaymentProgressOverlay } from "../components/PaymentProgressOverlay";
import { PriceSummary } from "../components/PriceSummary";
import { TestCardHint } from "../components/TestCardHint";
import { usePayment } from "../hooks/usePayment";
import { useQuote } from "../hooks/useQuote";

function StepDots() {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
      <View style={{ width: 8, height: 6, borderRadius: 3, backgroundColor: theme.color.accent }} />
      <View
        style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: theme.color.accent }}
      />
      <View style={{ width: 8, height: 6, borderRadius: 3, backgroundColor: theme.color.line }} />
    </View>
  );
}

function PickupOption({
  icon,
  title,
  subtitle,
  selected,
  onPress,
}: {
  icon: "zap" | "calendar";
  title: string;
  subtitle: string;
  selected: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ selected }}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        backgroundColor: selected ? theme.color.surfaceDark : theme.color.surfaceMuted,
        borderRadius: theme.radius.lg,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm + 2,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: theme.radius.sm,
          backgroundColor: selected ? theme.color.surfaceDarkRaised : theme.color.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={18} color={selected ? theme.color.gold : theme.color.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" color={selected ? "onDark" : "primary"}>
          {title}
        </Text>
        <Text
          variant="caption"
          color={selected ? "onDark" : "tertiary"}
          numberOfLines={1}
          style={[{ fontSize: 12 }, selected ? { opacity: 0.8 } : null]}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

export function CheckoutScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lines = useCartLines();
  const cart = useCartStore((state) => state.cart);
  const clearCart = useCartStore((state) => state.clearCart);
  const { data: restaurant } = useRestaurant(cart.restaurantId ?? undefined);
  const quote = useQuote();
  const { data: pickupName } = usePickupName();
  const { data: deviceId } = useDeviceId();
  const { pay, status, error, isReady } = usePayment();
  const [cardComplete, setCardComplete] = useState(false);
  const [showScheduleNote, setShowScheduleNote] = useState(false);
  const handleCardComplete = useCallback((complete: boolean) => setCardComplete(complete), []);

  const isBusy = status === "processing" || status === "authorizing" || status === "confirming";
  // On native the PaymentSheet is on screen while authorizing, so the overlay waits behind it.
  const overlayStatus = Platform.OS !== "web" && status === "authorizing" ? "idle" : status;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

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
      router.replace(`/order-success?orderId=${orderId}`);
    }
  };

  if (lines.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background }}>
        <View style={{ padding: theme.spacing.lg }}>
          <ScreenHeader title="Checkout" onBack={() => router.replace("/home")} />
        </View>
        <EmptyState
          icon="shopping-bag"
          title="Your bag is empty"
          body="Pick a restaurant, add a few dishes and the best deal is applied for you."
          action={
            <Button
              label="Browse deals"
              icon="compass"
              variant="dark"
              onPress={() => router.replace("/home")}
            />
          }
          style={{ flex: 1, justifyContent: "center" }}
        />
      </SafeAreaView>
    );
  }

  const heroPhoto = resolveFoodPhoto(restaurant?.heroPhoto);
  const dealTypes = Object.fromEntries(
    (restaurant?.deals ?? []).map((deal) => [deal.id, deal.type]),
  ) as Record<string, DealType>;
  const etaMinutes = restaurant?.prepMinutesMax ?? restaurant?.prepMinutesMin;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.color.background }}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          gap: theme.spacing.lg,
          paddingBottom: 160 + insets.bottom,
        }}
      >
        <ScreenHeader
          title="Checkout"
          subtitle={restaurant ? `${restaurant.name} · Pickup` : "Pickup"}
          onBack={() => router.back()}
          right={<StepDots />}
        />

        <Card style={{ gap: theme.spacing.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: theme.radius.sm,
                overflow: "hidden",
                backgroundColor: theme.color.surfaceMuted,
              }}
            >
              {heroPhoto ? (
                <Image source={heroPhoto} style={{ flex: 1 }} contentFit="cover" />
              ) : null}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">Pickup from {restaurant?.name ?? "the restaurant"}</Text>
              {restaurant?.address ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Icon name="map-pin" size={13} color={theme.color.textTertiary} />
                  <Text variant="caption" color="tertiary">
                    {streetAddress(restaurant.address)} ·{" "}
                    {restaurantDisplayExtras(restaurant.id).distanceMiles} mi away
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
            <PickupOption
              icon="zap"
              title="ASAP"
              subtitle={etaMinutes ? `Ready in ~${etaMinutes} min` : "Right after you pay"}
              selected
            />
            <PickupOption
              icon="calendar"
              title="Schedule"
              subtitle="Pick a time today"
              selected={false}
              onPress={() => setShowScheduleNote((current) => !current)}
            />
          </View>
          {showScheduleNote ? (
            <InlineAlert
              tone="info"
              title="Scheduled pickup is coming soon"
              message="For now the kitchen starts on your order as soon as it's paid."
            />
          ) : null}
        </Card>

        <Card style={{ gap: theme.spacing.md }}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <Text variant="heading">Your order</Text>
            <Text variant="caption" color="tertiary">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </Text>
          </View>
          {lines.map((line) => {
            const photo = resolveFoodPhoto(line.menuItem.photo);
            return (
              <View
                key={line.menuItem.id}
                style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: theme.radius.md,
                    overflow: "hidden",
                    backgroundColor: theme.color.surfaceMuted,
                  }}
                >
                  {photo ? <Image source={photo} style={{ flex: 1 }} contentFit="cover" /> : null}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {line.menuItem.name}
                  </Text>
                  <Text variant="caption" color="tertiary">
                    {["Qty " + line.quantity, menuItemDisplayExtras(line.menuItem.id).detail]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
                <Text variant="bodyStrong">
                  {formatCents(line.menuItem.priceCents * line.quantity)}
                </Text>
              </View>
            );
          })}
          <Pressable
            onPress={() => router.back()}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.sm,
              paddingTop: theme.spacing.xs,
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: theme.color.accentSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="plus" size={14} color={theme.color.accent} />
            </View>
            <Text variant="bodyStrong" color="accent">
              Add more from the menu
            </Text>
          </Pressable>
        </Card>

        {quote && quote.dealEvaluations.length > 0 ? (
          <Card style={{ gap: theme.spacing.md }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text variant="heading">Choose your deal</Text>
              {quote.appliedDeal ? (
                <Badge label="Auto-applied" tone="success" icon="check" size="sm" />
              ) : null}
            </View>
            <DealList
              evaluations={quote.dealEvaluations}
              appliedDealId={quote.appliedDeal?.dealId ?? null}
              dealTypes={dealTypes}
            />
          </Card>
        ) : null}

        {quote ? (
          <Card style={{ gap: theme.spacing.md }}>
            <Text variant="heading">Price details</Text>
            <PriceSummary quote={quote} />
          </Card>
        ) : null}

        <Card style={{ gap: theme.spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
            <Text variant="heading">Payment</Text>
            {IS_STRIPE_TEST_MODE ? <Badge label="TEST MODE" tone="goldSoft" size="sm" /> : null}
            <View style={{ flex: 1 }} />
            <Icon name="lock" size={13} color={theme.color.success} />
            <Text variant="caption" color="tertiary">
              Secured by Stripe
            </Text>
          </View>
          <PaymentCardForm onCompleteChange={handleCardComplete} disabled={isBusy} />
          {IS_STRIPE_TEST_MODE ? <TestCardHint /> : null}
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <Icon
              name="shield"
              size={14}
              color={theme.color.textTertiary}
              style={{ marginTop: 2 }}
            />
            <Text variant="caption" color="tertiary" style={{ flex: 1 }}>
              Paid securely via Stripe. Your payment goes to FoodieDeals, which pays{" "}
              {restaurant?.name ?? "the restaurant"}.
            </Text>
          </View>
        </Card>
      </ScrollView>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.color.surface,
          borderTopLeftRadius: theme.radius.xxl,
          borderTopRightRadius: theme.radius.xxl,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
          gap: theme.spacing.sm,
        }}
      >
        {status === "error" && error ? (
          <InlineAlert title="Payment didn't go through" message={error} />
        ) : null}
        <Button
          label={isBusy ? "Processing…" : cardComplete ? "Pay now" : "Enter card details"}
          icon="lock"
          variant="accent"
          size="lg"
          disabled={isBusy || !quote || !cardComplete || !isReady}
          onPress={handlePay}
          trailing={
            quote ? (
              <Text variant="title" color="onDark">
                {formatCents(quote.totalCents)}
              </Text>
            ) : null
          }
        />
        <Text variant="caption" color="tertiary" style={{ textAlign: "center" }}>
          Pickup order · No service or delivery fees
        </Text>
      </View>
      <PaymentProgressOverlay
        status={overlayStatus}
        totalLabel={quote ? formatCents(quote.totalCents) : "now"}
      />
    </SafeAreaView>
  );
}
