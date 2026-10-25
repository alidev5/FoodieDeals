import { Button, Card, Text, useTheme } from "@foodiedeals/ui-native";
import * as Linking from "expo-linking";
import { View } from "react-native";

export interface RestaurantContactCardProps {
  name: string;
  address: string;
  phone: string;
}

export function RestaurantContactCard({ name, address, phone }: RestaurantContactCardProps) {
  const theme = useTheme();

  const openDirections = () => {
    const query = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const call = () => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <Card padding="lg">
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="heading">{name}</Text>
        <Text variant="caption" color="secondary">
          {address}
        </Text>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
          <Button label="Directions" variant="outline" onPress={openDirections} style={{ flex: 1 }} />
          <Button label="Call" variant="outline" onPress={call} style={{ flex: 1 }} />
        </View>
      </View>
    </Card>
  );
}
