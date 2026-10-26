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
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs + 2,
        backgroundColor: "rgba(255,255,255,0.16)",
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs + 2,
      }}
    >
      <Animated.View
        style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#3DDC84" }, dotStyle]}
      />
      <Text variant="label" color="onDark" style={{ fontSize: 13 }}>
        Live
      </Text>
    </View>
  );
}
