import type { CardData } from "../types/telegram.types"
import { BaseCard } from "./base-card"
import { cardTheme } from "./card-theme"

export function SingleValueCard({ data }: { data: CardData }) {
  return (
    <BaseCard eyebrow={data.eyebrow} headline={data.headline} footer={data.insight}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          borderRadius: 20,
          backgroundColor: cardTheme.panel,
          border: `1px solid ${cardTheme.border}`,
        }}
      >
        <div
          style={{
            color: data.value?.startsWith("(") ? cardTheme.negative : cardTheme.foreground,
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {data.value ?? "0,00"}
        </div>
        {data.trend ? (
          <div style={{ color: cardTheme.accent, fontSize: 22, fontWeight: 700, marginTop: 18 }}>
            {data.trend}
          </div>
        ) : null}
      </div>
    </BaseCard>
  )
}
