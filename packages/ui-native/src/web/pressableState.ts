// react-native-web reports hover in the Pressable state callback; React Native's types omit it.
declare module "react-native" {
  interface PressableStateCallbackType {
    readonly hovered?: boolean;
  }
}

export {};
