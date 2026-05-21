export const colors = {
  primary: "#FF6B35",
  primaryDark: "#E55A24",
  primarySoft: "#FFE9DD",

  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceAlt: "#F5F5F7",
  surfaceMuted: "#F0F0F2",

  textPrimary: "#1A1A1A",
  textSecondary: "#666666",
  textMuted: "#999999",
  textOnPrimary: "#FFFFFF",

  mapBackground: "#EEEEF1",
  mapGrid: "#E2E2E6",
  userLocation: "#3B82F6",

  success: "#2E7D32",
  error: "#C62828",
  border: "#E5E5E7",
  divider: "#EBEBEE",
} as const;

export type ColorToken = keyof typeof colors;
