import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, View } from "react-native";

import { useTheme } from "../theme";

import { BrandMark } from "./BrandMark";
import { Text } from "./Text";

const USE_NATIVE_DRIVER = Platform.OS !== "web";

export interface BootSplashProps {
  tagline: string;
}

/** Full-screen brand splash shown while fonts and the stored session load. */
export function BootSplash({ tagline }: BootSplashProps) {
  const theme = useTheme();
  const entrance = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      friction: 7,
      tension: 60,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
    Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ).start();
  }, [entrance, progress]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.color.surfaceDark,
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing.xxxl,
      }}
    >
      <Animated.View
        style={{
          alignItems: "center",
          gap: theme.spacing.xl,
          opacity: entrance,
          transform: [
            { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
          ],
        }}
      >
        <BrandMark size={84} tone="dark" />
        <View style={{ alignItems: "center", gap: theme.spacing.xs }}>
          <Text variant="display" color="onDark">
            Foodie
            <Text variant="display" style={{ color: theme.color.gold }}>
              Deals
            </Text>
          </Text>
          <Text variant="body" color="onDark" style={{ opacity: 0.65, textAlign: "center" }}>
            {tagline}
          </Text>
        </View>
      </Animated.View>

      <View
        style={{
          position: "absolute",
          bottom: 72,
          width: 120,
          height: 4,
          borderRadius: 2,
          backgroundColor: theme.color.surfaceDarkRaised,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            width: 48,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.color.gold,
            transform: [
              { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-48, 120] }) },
            ],
          }}
        />
      </View>
    </View>
  );
}

/** True once `ms` has elapsed, so a splash never flashes for a single frame. */
export function useMinimumDelay(ms: number): boolean {
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setElapsed(true), ms);
    return () => clearTimeout(timer);
  }, [ms]);
  return elapsed;
}
