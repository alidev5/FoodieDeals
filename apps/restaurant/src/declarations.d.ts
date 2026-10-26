declare module "*.wav" {
  const value: number;
  export default value;
}

declare module "*.png" {
  import type { ImageSourcePropType } from "react-native";

  const value: ImageSourcePropType;
  export default value;
}
