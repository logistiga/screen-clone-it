import { createContext, useContext, useEffect, useState, ReactNode, forwardRef } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeProviderState | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export const ThemeProvider = forwardRef<HTMLDivElement, ThemeProviderProps>(
  function ThemeProvider(
    { children, defaultTheme = "system", storageKey = "logistiga-theme" },
    ref
  ) {
    const [theme, setTheme] = useState<Theme>(
      () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    );

    useEffect(() => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");

      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    }, [theme]);

    const value = {
      theme,
      setTheme: (theme: Theme) => {
        localStorage.setItem(storageKey, theme);
        setTheme(theme);
      },
    };

    return (
      <ThemeContext.Provider value={value}>
        <div ref={ref} style={{ display: "contents" }}>
          {children}
        </div>
      </ThemeContext.Provider>
    );
  }
);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
