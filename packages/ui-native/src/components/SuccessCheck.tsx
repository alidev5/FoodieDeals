import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, View } from "react-native";

import { useTheme } from "../theme";

import { Icon } from "./Icon";

const USE_NATIVE_DRIVER = Platform.OS !== "web";

export interface SuccessCheckProps {
  size?: number;
}

/** A check mark that pops in over two expanding rings. */
export function SuccessCheck({ size = 112 }: SuccessCheckProps) {
  const theme = useTheme();
  const pop = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(pop, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.loop(
        Animated.timing(ripple, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ),
    ]).start();
  }, [pop, ripple]);

  const ring = (delay: number) => {
    const value = ripple.interpolate({
      inputRange: [0, delay, 1],
      outputRange: [0, 0, 1],
      extrapolate: "clamp",
    });
    return (
      <Animated.View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.color.success,
          opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0] }),
          transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
        }}
      />
    );
  };

  return (
    <View
      style={{
        width: size * 1.7,
        height: size * 1.7,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {ring(0)}
      {ring(0.35)}
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.color.success,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale: pop }],
        }}
      >
        <Icon name="check" size={size * 0.5} color={theme.color.textOnDark} />
      </Animated.View>
    </View>
  );
}
