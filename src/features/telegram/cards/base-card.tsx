import type { ReactNode } from "react"
import { cardTheme } from "./card-theme"

interface BaseCardProps {
  eyebrow?: string
  headline: string
  children: ReactNode
  footer?: ReactNode
}

export function BaseCard({ eyebrow = "WISEVEO", headline, children, footer }: BaseCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(135deg, ${cardTheme.gradientStart} 0%, ${cardTheme.gradientEnd} 100%)`,
        color: cardTheme.foreground,
        fontFamily: "Noto Sans", // i18n-ignore: font family identifier, not UI copy
        padding: 35,
        position: "relative",
      }}
    >
      {/* Decorative light effect */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: "100%",
          background: `radial-gradient(circle, ${cardTheme.accent}33 0%, transparent 70%)`,
          display: "flex",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: cardTheme.accent,
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              opacity: 0.9,
            }}
          >
            {eyebrow}
          </div>
          <div style={{ color: cardTheme.foreground, fontSize: 32, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            {headline}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            flexShrink: 0,
            marginLeft: 22,
            borderRadius: 12,
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
            border: `1px solid ${cardTheme.border}`,
            color: cardTheme.foreground,
            fontSize: 20,
            fontWeight: 800,
          }}
        >
          {/* Decorative avatar initial — fixed brand mark, not translatable UI copy. i18n-ignore */}
          A
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>{children}</div>

      {footer ? (
        <div
          style={{
            display: "flex",
            marginTop: 14,
            paddingTop: 13,
            borderTop: `1px solid ${cardTheme.border}`,
            color: cardTheme.muted,
            fontSize: 17,
            lineHeight: 1.35,
          }}
        >
          {footer}
        </div>
      ) : null}
    </div>
  )
}
