import { theme } from "@foodiedeals/shared";

/**
 * Global web CSS. react-native-web leaves the browser's square focus outline on every
 * Pressable after a click; this removes it, shows a thin rounded ring only for keyboard
 * focus. Text inputs get their border and halo from TextField, so the browser adds nothing.
 */
export const WEB_FOCUS_CSS = `
*, *:focus { outline: none !important; -webkit-tap-highlight-color: transparent; }
[role="button"]:focus-visible, [role="link"]:focus-visible, [role="tab"]:focus-visible,
[role="radio"]:focus-visible, a:focus-visible, button:focus-visible {
  box-shadow: 0 0 0 2px ${theme.color.background}, 0 0 0 3.5px rgba(27, 22, 19, 0.55) !important;
}
input, textarea { caret-color: ${theme.color.accent}; }
input:focus, textarea:focus { box-shadow: none !important; }
::placeholder { color: ${theme.color.textTertiary}; opacity: 1; }
::selection { background: rgba(229, 72, 43, 0.16); }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: rgba(27, 22, 19, 0.16); border-radius: 999px; border: 3px solid transparent; background-clip: content-box; }
::-webkit-scrollbar-track { background: transparent; }
html, body { background: ${theme.color.background}; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }
`;

/**
 * Adds WEB_FOCUS_CSS to the page once. `+html.tsx` only runs for statically rendered sites, so
 * single-page web builds need it injected at runtime.
 */
export function injectWebGlobalCss() {
  if (typeof document === "undefined" || document.getElementById("foodiedeals-global-css")) return;
  const style = document.createElement("style");
  style.id = "foodiedeals-global-css";
  style.textContent = WEB_FOCUS_CSS;
  document.head.appendChild(style);
}
