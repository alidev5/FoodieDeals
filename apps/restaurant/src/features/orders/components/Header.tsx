import { IconButton, Text, Toggle, useTheme } from "@foodiedeals/ui-native";
import { Alert, Platform, View } from "react-native";

function printPage() {
  if (Platform.OS === "web") {
    window.print();
  } else {
    Alert.alert("Print", "Printing is available from the web dashboard.");
  }
}

export interface HeaderProps {
  title: string;
  isOpen: boolean;
  onToggleOpen: (next: boolean) => void;
}

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "short",
  day: "numeric",
});

export function Header({ title, isOpen, onToggleOpen }: HeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: theme.spacing.lg,
      }}
    >
      <View style={{ gap: 2, flexShrink: 1, minWidth: 220 }}>
        <Text variant="display">{title}</Text>
        <Text variant="body" color="tertiary">
          {DATE_FORMAT.format(new Date())} ·{" "}
          {isOpen ? "Accepting pickup orders" : "Paused, not taking new orders"}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
        <IconButton icon="printer" accessibilityLabel="Print" onPress={printPage} />
        <Toggle isOn={isOpen} onLabel="Open" offLabel="Paused" onToggle={onToggleOpen} />
      </View>
    </View>
  );
}
