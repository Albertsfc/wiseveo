import type { CardData } from "../types/telegram.types"
import { BaseCard } from "./base-card"
import { cardTheme, toneColor } from "./card-theme"

export function ListCard({ data }: { data: CardData }) {
  const items = (data.items ?? []).slice(0, 4)

  return (
    <BaseCard eyebrow={data.eyebrow} headline={data.headline} footer={data.insight}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "12px 20px",
              borderRadius: 16,
              backgroundColor: cardTheme.panelSoft,
              border: `1px solid ${cardTheme.border}`,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, gap: 2 }}>
              <div style={{ color: cardTheme.foreground, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
                {item.label}
              </div>
              {item.detail ? (
                <div style={{ color: cardTheme.muted, fontSize: 13, fontWeight: 500 }}>
                  {item.detail}
                </div>
              ) : null}
            </div>
            <div
              style={{
                color: toneColor(item.tone),
                fontSize: 19,
                fontWeight: 800,
                flexShrink: 0,
                textAlign: "right",
                letterSpacing: "-0.02em",
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </BaseCard>
  )
}
