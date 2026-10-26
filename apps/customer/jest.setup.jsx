// @expo/vector-icons loads fonts through expo-font, which has no native module under jest.
jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  const Icon = ({ name }) => <Text>{`icon:${name}`}</Text>;
  return { Feather: Icon, MaterialCommunityIcons: Icon };
});
