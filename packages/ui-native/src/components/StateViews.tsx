import type { ReactNode } from "react";
import { ActivityIndicator, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "../theme";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export interface LoadingStateProps {
  message?: string;
  style?: StyleProp<ViewStyle>;
}

export function LoadingState({ message, style }: LoadingStateProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: theme.spacing.md,
          padding: theme.spacing.xl,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.color.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.color.accent} />
      </View>
      {message ? (
        <Text variant="body" color="secondary">
          {message}
        </Text>
      ) : null}
    </View>
  );
}

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  body?: string;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({ icon, title, body, action, style }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          alignItems: "center",
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.xxxl,
          paddingHorizontal: theme.spacing.xl,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: theme.color.surface,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: theme.spacing.sm,
        }}
      >
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: theme.color.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon} size={26} color={theme.color.accent} />
        </View>
      </View>
      <Text variant="heading" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {body ? (
        <Text variant="body" color="secondary" style={{ textAlign: "center", maxWidth: 300 }}>
          {body}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: theme.spacing.sm }}>{action}</View> : null}
    </View>
  );
}

export interface InlineAlertProps {
  title: string;
  message?: string;
  tone?: "error" | "info";
  action?: ReactNode;
}

export function InlineAlert({ title, message, tone = "error", action }: InlineAlertProps) {
  const theme = useTheme();
  const isError = tone === "error";
  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: "row",
        gap: theme.spacing.md,
        backgroundColor: isError ? theme.color.accentSoft : theme.color.surfaceMuted,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        alignItems: "flex-start",
      }}
    >
      <Icon
        name={isError ? "alert-circle" : "info"}
        size={18}
        color={isError ? theme.color.accentDeep : theme.color.textSecondary}
        style={{ marginTop: 2 }}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" style={isError ? { color: theme.color.accentDeep } : null}>
          {title}
        </Text>
        {message ? (
          <Text variant="caption" color="secondary">
            {message}
          </Text>
        ) : null}
        {action ? <View style={{ marginTop: theme.spacing.sm }}>{action}</View> : null}
      </View>
    </View>
  );
}
