import { useWindowDimensions } from "react-native";

import { useSidebarCollapsed } from "./sidebarPreference";

/** Below this the sidebar is always an icon rail, whatever the saved preference. */
const FORCE_RAIL_BELOW = 1024;
/** Below this the order list and detail panel stack instead of sitting side by side. */
const STACK_BELOW = 900;

export function useDashboardLayout() {
  const { width } = useWindowDimensions();
  const isCollapsed = useSidebarCollapsed();
  const isRailForced = width < FORCE_RAIL_BELOW;
  return {
    isRail: isCollapsed || isRailForced,
    canExpand: !isRailForced,
    isStacked: width < STACK_BELOW,
  };
}
