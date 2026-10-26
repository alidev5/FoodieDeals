module.exports = function (api) {
  api.cache(true);
  // babel-preset-expo adds the react-native-worklets plugin that Reanimated 4 needs.
  return {
    presets: ["babel-preset-expo"],
  };
};
