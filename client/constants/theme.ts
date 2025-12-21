import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#F5F5F7",
    textSecondary: "#8E8E93",
    buttonText: "#FFFFFF",
    tabIconDefault: "#8E8E93",
    tabIconSelected: "#FF6B6B",
    link: "#FF6B6B",
    backgroundRoot: "#0A0E1A",
    backgroundDefault: "#1A1F2E",
    backgroundSecondary: "#252B3D",
    backgroundTertiary: "#2F3649",
    accent: "#FF6B6B",
    accentSecondary: "#FFB347",
    success: "#34C759",
    error: "#FF3B30",
    border: "rgba(255,255,255,0.1)",
  },
  dark: {
    text: "#F5F5F7",
    textSecondary: "#8E8E93",
    buttonText: "#FFFFFF",
    tabIconDefault: "#8E8E93",
    tabIconSelected: "#FF6B6B",
    link: "#FF6B6B",
    backgroundRoot: "#0A0E1A",
    backgroundDefault: "#1A1F2E",
    backgroundSecondary: "#252B3D",
    backgroundTertiary: "#2F3649",
    accent: "#FF6B6B",
    accentSecondary: "#FFB347",
    success: "#34C759",
    error: "#FF3B30",
    border: "rgba(255,255,255,0.1)",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  inputHeight: 56,
  buttonHeight: 56,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const Typography = {
  display: {
    fontSize: 56,
    fontWeight: "700" as const,
    letterSpacing: -1,
  },
  h1: {
    fontSize: 32,
    fontWeight: "600" as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 13,
    fontWeight: "500" as const,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
    display: "system-ui",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
    display: "normal",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    display: "'Pluvix', system-ui, -apple-system, sans-serif",
  },
});

export const Shadows = {
  floatingButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 4,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 2,
  },
};

export const Gradients = {
  accent: ["#FF6B6B", "#FFB347"],
  accentDark: ["#E55A5A", "#E89F3A"],
  overlay: ["transparent", "rgba(10, 14, 26, 0.9)"],
};
