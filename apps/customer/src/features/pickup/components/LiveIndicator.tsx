import { Text, useTheme } from "@foodiedeals/ui-native";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export function LiveIndicator() {
  const theme = useTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
    );
  }, [opacity]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
      <Animated.View
        style={[
          { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.color.success },
          dotStyle,
        ]}
      />
      <Text variant="label" color="success">
        Live
      </Text>
    </View>
  );
}
