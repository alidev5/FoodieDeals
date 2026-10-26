import { Icon, Text, useTheme } from "@foodiedeals/ui-native";
import { useState } from "react";
import { Platform, Pressable, View } from "react-native";

const TEST_CARDS = [
  { number: "4242 4242 4242 4242", label: "Succeeds" },
  { number: "4000 0027 6000 3184", label: "Asks for 3D Secure" },
  { number: "4000 0000 0000 9995", label: "Declined" },
];

async function copyToClipboard(value: string): Promise<boolean> {
  if (Platform.OS !== "web" || !globalThis.navigator?.clipboard) {
    return false;
  }
  await globalThis.navigator.clipboard.writeText(value.replace(/\s/g, ""));
  return true;
}

/** Stripe's published test cards, shown only while checkout runs against a test-mode key. */
export function TestCardHint() {
  const theme = useTheme();
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <View
      style={{
        backgroundColor: theme.color.goldSoft,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
        <Icon name="mc:flask-outline" size={16} color={theme.color.text} />
        <Text variant="bodyStrong">Stripe test cards</Text>
        <Text variant="caption" color="secondary" style={{ flex: 1 }} numberOfLines={1}>
          any future date · any CVC
        </Text>
      </View>
      {TEST_CARDS.map((card) => (
        <Pressable
          key={card.number}
          onPress={async () => {
            if (await copyToClipboard(card.number)) {
              setCopied(card.number);
              setTimeout(() => setCopied(null), 1500);
            }
          }}
          accessibilityLabel={`Copy test card ${card.number}`}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.sm,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text variant="bodyStrong" style={{ fontVariant: ["tabular-nums"], letterSpacing: 0.5 }}>
            {card.number}
          </Text>
          <Text variant="caption" color="tertiary" style={{ flex: 1 }} numberOfLines={1}>
            {card.label}
          </Text>
          {Platform.OS === "web" ? (
            <Icon
              name={copied === card.number ? "check" : "copy"}
              size={14}
              color={copied === card.number ? theme.color.success : theme.color.textTertiary}
            />
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}
