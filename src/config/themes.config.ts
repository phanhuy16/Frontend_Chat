// Theme configuration for advanced theme system
export type ThemePreference = 
  | 'light' 
  | 'dark' 
  | 'gradient-ocean' 
  | 'gradient-sunset' 
  | 'gradient-forest'
  | 'glass-light' 
  | 'glass-dark';

export interface ThemeConfig {
  name: ThemePreference;
  displayName: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
  };
  gradients?: string[];
  glassEffect?: boolean;
}

export const THEME_CONFIGS: Record<ThemePreference, ThemeConfig> = {
  light: {
    name: 'light',
    displayName: 'Light',
    colors: {
      primary: '#6366f1',
      secondary: '#ec4899',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
    },
  },
  dark: {
    name: 'dark',
    displayName: 'Dark',
    colors: {
      primary: '#6366f1',
      secondary: '#ec4899',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
    },
  },
  'gradient-ocean': {
    name: 'gradient-ocean',
    displayName: 'Ocean Gradient',
    colors: {
      primary: '#06b6d4',
      secondary: '#3b82f6',
      background: '#0c4a6e',
      surface: '#075985',
      text: '#f0f9ff',
    },
    gradients: ['#06b6d4', '#0284c7', '#0369a1', '#075985'],
  },
  'gradient-sunset': {
    name: 'gradient-sunset',
    displayName: 'Sunset Gradient',
    colors: {
      primary: '#f97316',
      secondary: '#ec4899',
      background: '#7c2d12',
      surface: '#9a3412',
      text: '#fff7ed',
    },
    gradients: ['#f97316', '#ea580c', '#dc2626', '#be123c'],
  },
  'gradient-forest': {
    name: 'gradient-forest',
    displayName: 'Forest Gradient',
    colors: {
      primary: '#10b981',
      secondary: '#14b8a6',
      background: '#064e3b',
      surface: '#065f46',
      text: '#ecfdf5',
    },
    gradients: ['#10b981', '#059669', '#047857', '#065f46'],
  },
  'glass-light': {
    name: 'glass-light',
    displayName: 'Glass Light',
    colors: {
      primary: '#8b5cf6',
      secondary: '#a78bfa',
      background: '#f5f3ff',
      surface: 'rgba(255, 255, 255, 0.7)',
      text: '#2e1065',
    },
    glassEffect: true,
  },
  'glass-dark': {
    name: 'glass-dark',
    displayName: 'Glass Dark',
    colors: {
      primary: '#a78bfa',
      secondary: '#c4b5fd',
      background: '#1e1b4b',
      surface: 'rgba(30, 27, 75, 0.7)',
      text: '#ede9fe',
    },
    glassEffect: true,
  },
};

export const CHAT_WALLPAPERS = [
  {
    id: "default",
    name: "Mặc định",
    value: "transparent",
  },
  {
    id: "solid-dark",
    name: "Tối giản",
    value: "#0f172a",
  },
  {
    id: "gradient-blue",
    name: "Xanh biển",
    value: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
  },
  {
    id: "gradient-purple",
    name: "Tím mộng",
    value: "linear-gradient(135deg, #4c1d95, #7c3aed)",
  },
  {
    id: "pattern-dots",
    name: "Họa tiết",
    value: "radial-gradient(#ffffff22 1px, transparent 1px)",
    size: "20px 20px",
  },
];
