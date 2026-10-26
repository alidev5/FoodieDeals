import { useEffect, type ReactNode } from "react";
import { Platform, StyleSheet, useWindowDimensions, View, type DimensionValue } from "react-native";

/** The dashboard renders as if the screen were zoomed out to 80%. */
const ZOOM = 0.8;
/** Phone browsers keep 100%, so text stays readable and inputs don't trigger iOS focus zoom. */
const WEB_MIN_WIDTH = 1024;

function zoomFor(windowWidth: number) {
  if (Platform.OS !== "web") return ZOOM;
  return windowWidth >= WEB_MIN_WIDTH ? ZOOM : 1;
}

/**
 * Wraps the whole app at the dashboard zoom. Web uses CSS zoom on the page; native lays the app
 * out on a larger canvas and scales it down, which is what a browser zoom does.
 */
export function ZoomRoot({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const zoom = zoomFor(width);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    document.documentElement.style.zoom = zoom === 1 ? "" : String(zoom);
  }, [zoom]);

  if (Platform.OS === "web" || zoom === 1) return children;
  const size = `${100 / zoom}%` as DimensionValue;
  return (
    <View style={styles.clip}>
      <View
        style={{
          width: size,
          height: size,
          transformOrigin: "top left",
          transform: [{ scale: zoom }],
        }}
      >
        {children}
      </View>
    </View>
  );
}

/**
 * The window width in the app's own (zoomed) units. Neither CSS zoom nor the native scale
 * changes useWindowDimensions, so layout breakpoints read this instead.
 */
export function useLayoutWidth() {
  const { width } = useWindowDimensions();
  return width / zoomFor(width);
}

const styles = StyleSheet.create({
  clip: { flex: 1, overflow: "hidden" },
});
