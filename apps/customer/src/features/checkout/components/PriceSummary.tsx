import type { Quote } from "@foodiedeals/shared";
import { formatCents } from "@foodiedeals/shared";
import { Text, useTheme } from "@foodiedeals/ui-native";
import { View } from "react-native";

export interface PriceSummaryProps {
  quote: Quote;
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text variant="body" color="secondary">
        {label}
      </Text>
      <Text variant="body" color={accent ? "accent" : "primary"}>
        {value}
      </Text>
    </View>
  );
}

export function PriceSummary({ quote }: PriceSummaryProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Row label="Subtotal" value={formatCents(quote.subtotalCents)} />
      {quote.discountCents > 0 ? (
        <Row label="Deal savings" value={`-${formatCents(quote.discountCents)}`} accent />
      ) : null}
      <Row label="Fees" value="$0.00 · pickup" />
      <Row label="Tax" value={formatCents(quote.taxCents)} />
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: theme.color.line,
          marginTop: theme.spacing.xs,
          paddingTop: theme.spacing.sm,
        }}
      >
        <Row label="Total" value={formatCents(quote.totalCents)} />
      </View>
    </View>
  );
}
