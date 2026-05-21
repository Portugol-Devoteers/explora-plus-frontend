import { TextStyle } from "react-native";

export const typography = {
  display: { fontSize: 48, fontWeight: "bold" } as TextStyle,
  title: { fontSize: 24, fontWeight: "600" } as TextStyle,
  subtitle: { fontSize: 18, fontWeight: "500" } as TextStyle,
  body: { fontSize: 16, fontWeight: "400" } as TextStyle,
  caption: { fontSize: 13, fontWeight: "400" } as TextStyle,
} as const;
