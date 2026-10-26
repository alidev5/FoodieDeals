import { DEMO_CUSTOMERS, type DemoCustomer } from "@foodiedeals/shared";
import { BrandMark, Button, Icon, Text, useTheme, type IconName } from "@foodiedeals/ui-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { initials } from "../../../lib/display";
import { resolveFoodPhoto } from "../../../lib/foodPhotos";
import { useSignIn } from "../hooks/useCustomerSession";

const HERO_PHOTOS = ["miso-ramen.png", "margherita-pizza.png", "dumpling-plate.png"];

const VALUE_PROPS: Array<{ icon: IconName; label: string }> = [
  { icon: "tag", label: "Best deal\nauto-applied" },
  { icon: "zap", label: "Skip the\nline" },
  { icon: "mc:storefront-outline", label: "Zero\ndelivery fees" },
];

function HeroCollage() {
  const theme = useTheme();
  const [large, ...small] = HERO_PHOTOS.map((name) => resolveFoodPhoto(name));

  return (
    <View style={{ height: 220, flexDirection: "row", gap: theme.spacing.sm }}>
      <View style={{ flex: 1.4, borderRadius: theme.radius.xxl, overflow: "hidden" }}>
        <Image source={large} style={{ flex: 1 }} contentFit="cover" />
        <View
          style={{
            position: "absolute",
            left: theme.spacing.md,
            bottom: theme.spacing.md,
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.xs,
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.pill,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.xs,
          }}
        >
          <Icon name="tag" size={13} color={theme.color.accent} />
          <Text variant="label">20% off today</Text>
        </View>
      </View>
      <View style={{ flex: 1, gap: theme.spacing.sm }}>
        {small.map((photo, index) => (
          <View key={index} style={{ flex: 1, borderRadius: theme.radius.xl, overflow: "hidden" }}>
            <Image source={photo} style={{ flex: 1 }} contentFit="cover" />
          </View>
        ))}
      </View>
    </View>
  );
}

function DemoAccountRow({
  account,
  onPress,
  isBusy,
}: {
  account: DemoCustomer;
  onPress: () => void;
  isBusy: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={isBusy}
      accessibilityRole="button"
      accessibilityLabel={`Continue as ${account.pickupName}`}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.color.line,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: theme.color.surfaceDark,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text variant="bodyStrong" style={{ color: theme.color.gold }}>
          {initials(account.pickupName, 2)}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">{account.pickupName}</Text>
        <Text variant="caption" color="tertiary" numberOfLines={1}>
          {account.description}
        </Text>
      </View>
      {isBusy ? (
        <ActivityIndicator color={theme.color.accent} />
      ) : (
        <Icon name="arrow-right" size={18} color={theme.color.textSecondary} />
      )}
    </Pressable>
  );
}

export function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [name, setName] = useState("");
  const [pendingDemoId, setPendingDemoId] = useState<string | null>(null);
  const signIn = useSignIn();

  const canContinue = name.trim().length > 1 && !signIn.isPending;

  const handleContinue = async () => {
    if (!canContinue) return;
    await signIn.mutateAsync({ pickupName: name.trim() });
    router.replace("/home");
  };

  const handleDemo = async (account: DemoCustomer) => {
    setPendingDemoId(account.deviceId);
    await signIn.mutateAsync({ pickupName: account.pickupName, deviceId: account.deviceId });
    router.replace("/home");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: theme.spacing.xl,
          gap: theme.spacing.xl,
          maxWidth: 520,
          width: "100%",
          alignSelf: "center",
        }}
      >
        <BrandMark size={40} withWordmark subtitle="Pickup deals near you" />

        <HeroCollage />

        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="display">
            Great food,{"\n"}
            <Text variant="display" color="accent">
              better deals.
            </Text>
          </Text>
          <Text variant="body" color="secondary">
            Order ahead from restaurants nearby, pay in the app and pick up by name.
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          {VALUE_PROPS.map((prop) => (
            <View
              key={prop.label}
              style={{
                flex: 1,
                backgroundColor: theme.color.surface,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.md,
                gap: theme.spacing.sm,
              }}
            >
              <Icon name={prop.icon} size={18} color={theme.color.accent} />
              <Text variant="caption" style={{ fontSize: 12, lineHeight: 16 }}>
                {prop.label}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={{
            backgroundColor: theme.color.surfaceDark,
            borderRadius: theme.radius.xxl,
            padding: theme.spacing.xl,
            gap: theme.spacing.md,
          }}
        >
          <Text variant="heading" color="onDark">
            What&apos;s your pickup name?
          </Text>
          <Text variant="caption" color="onDark" style={{ opacity: 0.65, marginTop: -6 }}>
            The counter calls this out when your order is ready.
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleContinue}
            placeholder="e.g. Hamza M."
            placeholderTextColor={theme.color.textTertiary}
            autoCapitalize="words"
            returnKeyType="go"
            accessibilityLabel="Pickup name"
            style={{
              backgroundColor: theme.color.surface,
              borderRadius: theme.radius.md,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md + 2,
              fontSize: theme.type.scale.body.fontSize,
              color: theme.color.text,
            }}
          />
          <Button
            label={signIn.isPending && !pendingDemoId ? "Setting up…" : "Get started"}
            variant="accent"
            trailingIcon="arrow-right"
            disabled={!canContinue}
            onPress={handleContinue}
          />
        </View>

        <View style={{ gap: theme.spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.color.line }} />
            <Text variant="caption" color="tertiary">
              or explore with a demo account
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.color.line }} />
          </View>
          {DEMO_CUSTOMERS.map((account) => (
            <DemoAccountRow
              key={account.deviceId}
              account={account}
              isBusy={pendingDemoId === account.deviceId}
              onPress={() => handleDemo(account)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
