import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  accentColor: string;
  fontSize: string;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  updateAccentColor: (color: string) => void;
  updateFontSize: (size: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  const [accentColor, setAccentColor] = useState(
    localStorage.getItem("theme-accent") || "#6366f1"
  );
  const [fontSize, setFontSizeState] = useState(
    localStorage.getItem("font-size") || "normal"
  );

  useEffect(() => {
    // Apply theme to document element
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    // Apply accent color
    const root = document.documentElement;
    root.style.setProperty("--primary", accentColor);

    // Generate variants if needed (simple hex manipulation or just using the same color)
    // For simplicity, we'll just set the primary and use opacity in tailwind for hover/light
    root.style.setProperty("--primary-hover", `${accentColor}ee`);
    root.style.setProperty("--primary-light", `${accentColor}88`);
    root.style.setProperty("--primary-dark", `${accentColor}cc`);

    localStorage.setItem("theme-accent", accentColor);
  }, [accentColor]);

  useEffect(() => {
    // Apply font size globally by setting root font-size
    // Default browser font-size is usually 16px
    const root = document.documentElement;
    let sizeValue = "16px"; // Normal
    if (fontSize === "small") sizeValue = "14px";
    if (fontSize === "large") sizeValue = "18px";

    root.style.fontSize = sizeValue;

    // Also keep the custom variable for messages if we want to fine-tune them
    root.style.setProperty(
      "--message-text",
      fontSize === "small"
        ? "0.9375rem"
        : fontSize === "large"
        ? "1.125rem"
        : "1rem"
    );

    localStorage.setItem("font-size", fontSize);
  }, [fontSize]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const updateAccentColor = (color: string) => {
    setAccentColor(color);
  };

  const updateFontSize = (size: string) => {
    setFontSizeState(size);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        accentColor,
        fontSize,
        toggleTheme,
        setTheme,
        updateAccentColor,
        updateFontSize,
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
