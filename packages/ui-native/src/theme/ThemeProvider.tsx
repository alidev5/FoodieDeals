import { theme, type Theme } from "@foodiedeals/shared";
import { createContext, useContext, type PropsWithChildren } from "react";

const ThemeContext = createContext<Theme>(theme);

export function ThemeProvider({ children }: PropsWithChildren) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
