import type { CardData } from "../types/telegram.types"
import { BaseCard } from "./base-card"
import { cardTheme, toneColor } from "./card-theme"

function clampProgress(progress: number | undefined) {
  if (!Number.isFinite(progress ?? Number.NaN)) return 0
  return Math.max(0, Math.min(progress ?? 0, 100))
}

export function CategoryCard({ data }: { data: CardData }) {
  const items = (data.items ?? []).slice(0, 4)
  const mainProgress = clampProgress(data.progress)

  return (
    <BaseCard eyebrow={data.eyebrow} headline={data.headline} footer={data.insight}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: 18,
            borderRadius: 16,
            backgroundColor: cardTheme.panel,
            border: `1px solid ${cardTheme.border}`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ color: cardTheme.muted, fontSize: 18 }}>Execucao</div>
            <div style={{ color: cardTheme.foreground, fontSize: 18, fontWeight: 700 }}>
              {data.value ?? `${mainProgress.toFixed(0)}%`}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              width: "100%",
              height: 16,
              borderRadius: 999,
              backgroundColor: cardTheme.panelSoft,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${mainProgress}%`,
                backgroundColor: mainProgress >= 100 ? cardTheme.negative : cardTheme.positive,
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item, index) => {
            const progress = clampProgress(item.progress)

            return (
              <div key={`${item.label}-${index}`} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17 }}>
                  <div style={{ color: cardTheme.muted }}>{item.label}</div>
                  <div style={{ color: toneColor(item.tone), fontWeight: 700 }}>{item.value}</div>
                </div>
                <div
                  style={{
                    display: "flex",
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: cardTheme.panelSoft,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      backgroundColor: progress >= 100 ? cardTheme.negative : cardTheme.accent,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </BaseCard>
  )
}
