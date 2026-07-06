export const CARD_SIZE = {
  width: 800,
  height: 420,
}

export const cardTheme = {
  background: "#0a0c10",
  gradientStart: "#11141d",
  gradientEnd: "#0a0c10",
  panel: "rgba(27, 31, 42, 0.7)",
  panelSoft: "rgba(36, 42, 54, 0.5)",
  foreground: "#f7f8fb",
  muted: "#94a3b8",
  border: "rgba(255, 255, 255, 0.08)",
  positive: "#10b981",
  negative: "#ef4444",
  warning: "#f59e0b",
  accent: "#3b82f6",
}

export function toneColor(tone?: "default" | "positive" | "negative" | "warning") {
  if (tone === "positive") return cardTheme.positive
  if (tone === "negative") return cardTheme.negative
  if (tone === "warning") return cardTheme.warning
  return cardTheme.foreground
}
