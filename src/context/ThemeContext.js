import { createContext, useContext, useState, useEffect } from "react";
import { darkTheme, lightTheme } from "../theme/colors";
import * as SecureStore from "expo-secure-store";

const ThemeContext = createContext(null);

const THEME_KEY = "app_theme";

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const stored = await SecureStore.getItemAsync(THEME_KEY);
      if (stored !== null) {
        setIsDark(stored === "dark");
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    try {
      await SecureStore.setItemAsync(THEME_KEY, next ? "dark" : "light");
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
