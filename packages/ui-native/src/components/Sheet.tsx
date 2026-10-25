import { useEffect, useRef, type PropsWithChildren } from "react";
import { Animated, Modal, Pressable, StyleSheet, View } from "react-native";

import { useTheme } from "../theme";

export interface SheetProps extends PropsWithChildren {
  visible: boolean;
  onDismiss: () => void;
}

export function Sheet({ visible, onDismiss, children }: SheetProps) {
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : 300,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.color.surface,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
              padding: theme.spacing.xl,
              transform: [{ translateY }],
            },
          ]}
        >
          <Pressable onPress={(event) => event.stopPropagation()}>
            <View>{children}</View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(27, 22, 19, 0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
  },
});
