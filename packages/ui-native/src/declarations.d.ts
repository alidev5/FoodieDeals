declare module "*.png" {
  // Metro registers every image as an asset and hands back its numeric id, on all platforms.
  const value: number;
  export default value;
}
