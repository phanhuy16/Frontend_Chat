import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  THEME_CONFIGS,
  ThemePreference,
  ThemeConfig,
} from "../config/themes.config";
import { userApi } from "../api/user.api";

interface ThemeContextType {
  theme: ThemePreference;
  themeConfig: ThemeConfig;
  accentColor: string;
  fontSize: string;
  globalChatWallpaper: string;
  setTheme: (theme: ThemePreference) => void;
  updateAccentColor: (color: string) => void;
  updateFontSize: (size: string) => void;
  setGlobalChatWallpaper: (wallpaper: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem("theme") as ThemePreference;
    if (saved && THEME_CONFIGS[saved]) {
      return saved;
    }
    return "light";
  });

  const [accentColor, setAccentColor] = useState(
    localStorage.getItem("theme-accent") || "#6366f1",
  );

  const [fontSize, setFontSizeState] = useState(
    localStorage.getItem("font-size") || "normal",
  );

  const [globalChatWallpaper, setGlobalChatWallpaperState] = useState(
    localStorage.getItem("chat-wallpaper") || "default",
  );

  const themeConfig = THEME_CONFIGS[theme];

  // Apply theme classes and CSS variables
  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme classes
    Object.keys(THEME_CONFIGS).forEach((t) => {
      root.classList.remove(`theme-${t}`);
    });

    // Add current theme class
    root.classList.add(`theme-${theme}`);

    // Handle dark mode for basic themes
    if (
      theme === "dark" ||
      theme.includes("glass-dark") ||
      theme.includes("gradient-")
    ) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply theme CSS variables
    root.style.setProperty("--theme-primary", themeConfig.colors.primary);
    root.style.setProperty("--theme-secondary", themeConfig.colors.secondary);
    root.style.setProperty("--theme-background", themeConfig.colors.background);
    root.style.setProperty("--theme-surface", themeConfig.colors.surface);
    root.style.setProperty("--theme-text", themeConfig.colors.text);

    // Apply gradients if available
    if (themeConfig.gradients) {
      const gradientCSS = `linear-gradient(135deg, ${themeConfig.gradients.join(", ")})`;
      root.style.setProperty("--theme-gradient", gradientCSS);
    }

    localStorage.setItem("theme", theme);
  }, [theme, themeConfig]);

  // Apply accent color
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", accentColor);
    root.style.setProperty("--primary-hover", `${accentColor}ee`);
    root.style.setProperty("--primary-light", `${accentColor}88`);
    root.style.setProperty("--primary-dark", `${accentColor}cc`);
    localStorage.setItem("theme-accent", accentColor);
  }, [accentColor]);

  // Apply font size
  useEffect(() => {
    const root = document.documentElement;
    let sizeValue = "16px";
    if (fontSize === "small") sizeValue = "14px";
    if (fontSize === "large") sizeValue = "18px";

    root.style.fontSize = sizeValue;
    root.style.setProperty(
      "--message-text",
      fontSize === "small"
        ? "0.9375rem"
        : fontSize === "large"
          ? "1.125rem"
          : "1rem",
    );

    localStorage.setItem("font-size", fontSize);
  }, [fontSize]);

  const setTheme = async (newTheme: ThemePreference) => {
    setThemeState(newTheme);

    // Sync with backend
    try {
      await userApi.updateThemePreference(newTheme);
    } catch (error) {
      console.error("Failed to sync theme with backend:", error);
    }
  };

  const updateAccentColor = (color: string) => {
    setAccentColor(color);
  };

  const updateFontSize = (size: string) => {
    setFontSizeState(size);
  };

  const setGlobalChatWallpaper = (wallpaper: string) => {
    setGlobalChatWallpaperState(wallpaper);
    localStorage.setItem("chat-wallpaper", wallpaper);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeConfig,
        accentColor,
        fontSize,
        globalChatWallpaper,
        setTheme,
        updateAccentColor,
        updateFontSize,
        setGlobalChatWallpaper,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
