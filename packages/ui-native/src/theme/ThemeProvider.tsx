import { theme, type Theme } from "@foodiedeals/shared";
import { createContext, useContext, useMemo, type PropsWithChildren } from "react";

const ThemeContext = createContext<Theme>(theme);

export interface ThemeProviderProps extends PropsWithChildren {
  /**
   * Scales type, spacing and radii, e.g. 0.85 for a denser desktop dashboard.
   * Colors and the pill radius are unchanged.
   */
  density?: number;
}

function scaleTheme(base: Theme, density: number): Theme {
  const scale = (value: number) => Math.round(value * density);
  const mapValues = <T extends Record<string, number>>(values: T): T =>
    Object.fromEntries(Object.entries(values).map(([key, value]) => [key, scale(value)])) as T;

  return {
    ...base,
    spacing: mapValues(base.spacing),
    radius: { ...mapValues(base.radius), pill: base.radius.pill },
    type: {
      ...base.type,
      scale: Object.fromEntries(
        Object.entries(base.type.scale).map(([key, entry]) => [
          key,
          { ...entry, fontSize: scale(entry.fontSize), lineHeight: scale(entry.lineHeight) },
        ]),
      ) as Theme["type"]["scale"],
    },
  };
}

export function ThemeProvider({ children, density = 1 }: ThemeProviderProps) {
  const value = useMemo(() => (density === 1 ? theme : scaleTheme(theme, density)), [density]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
