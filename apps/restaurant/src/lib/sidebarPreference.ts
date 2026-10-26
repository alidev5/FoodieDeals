import { useSyncExternalStore } from "react";
import { Platform } from "react-native";

const STORAGE_KEY = "foodiedeals.sidebar-collapsed";
const listeners = new Set<() => void>();

function readInitial(): boolean {
  if (Platform.OS !== "web") return false;
  return globalThis.localStorage?.getItem(STORAGE_KEY) === "1";
}

let collapsed = readInitial();

export function setSidebarCollapsed(next: boolean) {
  collapsed = next;
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(STORAGE_KEY, next ? "1" : "0");
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The user's collapse choice, shared by every dashboard page and kept across reloads. */
export function useSidebarCollapsed(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => collapsed,
    () => false,
  );
}
