import type { Quote } from "@foodiedeals/shared";
import { formatCents, SALES_TAX_RATE } from "@foodiedeals/shared";
import { Icon, Text, useTheme } from "@foodiedeals/ui-native";
import { View } from "react-native";

export interface PriceSummaryProps {
  quote: Quote;
  /** The applied deal's name; falls back to quote.appliedDeal. */
  dealName?: string | null;
  showSavingsBanner?: boolean;
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text variant="body" color={accent ? "accent" : "secondary"}>
        {label}
      </Text>
      <Text variant="bodyStrong" color={accent ? "accent" : "primary"}>
        {value}
      </Text>
    </View>
  );
}

const TAX_PERCENT_LABEL = `${(SALES_TAX_RATE * 100).toFixed(3).replace(/0+$/, "")}%`;

export function PriceSummary({ quote, dealName, showSavingsBanner = true }: PriceSummaryProps) {
  const theme = useTheme();
  const appliedName = dealName ?? quote.appliedDeal?.dealName ?? null;

  return (
    <View style={{ gap: theme.spacing.md }}>
      <Row label="Subtotal" value={formatCents(quote.subtotalCents)} />
      {quote.discountCents > 0 ? (
        <Row
          label={appliedName ? `Deal · ${appliedName}` : "Deal"}
          value={`-${formatCents(quote.discountCents)}`}
          accent
        />
      ) : null}
      <Row label={`NY sales tax (${TAX_PERCENT_LABEL})`} value={formatCents(quote.taxCents)} />
      <Row label="Service fee" value="$0.00" />
      <Row label="Delivery fee" value="$0.00 · Pickup" />
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: theme.color.line,
          paddingTop: theme.spacing.md,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text variant="heading">Total</Text>
        <Text variant="title">{formatCents(quote.totalCents)}</Text>
      </View>
      {showSavingsBanner && quote.discountCents > 0 ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
            backgroundColor: theme.color.successSoft,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
          }}
        >
          <Icon name="gift" size={16} color={theme.color.success} />
          <Text variant="bodyStrong" color="success">
            You're saving {formatCents(quote.discountCents)} on this order
          </Text>
        </View>
      ) : null}
    </View>
  );
}
