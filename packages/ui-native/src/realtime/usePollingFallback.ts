import { useEffect, useRef } from "react";
import { AppState } from "react-native";

/**
 * Runs `refresh` every `intervalMs` while realtime isn't live and the app is in the foreground,
 * and once whenever the app returns to the foreground.
 */
export function usePollingFallback(isLive: boolean, intervalMs: number, refresh: () => void) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshRef.current();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (isLive) return;
    const timer = setInterval(() => {
      if (AppState.currentState !== "background") refreshRef.current();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isLive, intervalMs]);
}
