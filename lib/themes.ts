export type ThemeToken = {
  name: string;
  value: string;
  foreground: string;
  soft: string;
};

export const THEME_COLORS: ThemeToken[] = [
  { name: "Azul", value: "#2563eb", foreground: "#eff6ff", soft: "#dbeafe" },
  { name: "Verde", value: "#059669", foreground: "#ecfdf5", soft: "#d1fae5" },
  { name: "Rosa", value: "#db2777", foreground: "#fdf2f8", soft: "#fce7f3" },
  { name: "Âmbar", value: "#d97706", foreground: "#fffbeb", soft: "#fef3c7" },
  { name: "Grafite", value: "#334155", foreground: "#f8fafc", soft: "#e2e8f0" },
];

export function getThemeByColor(primaryColor: string) {
  return (
    THEME_COLORS.find((theme) => theme.value === primaryColor) ?? {
      name: "Personalizada",
      value: primaryColor,
      foreground: "#ffffff",
      soft: "#f1f5f9",
    }
  );
}
