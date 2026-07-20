import type { CardData, TelegramTranslator } from "../types/telegram.types"
import { BaseCard } from "./base-card"
import { cardTheme } from "./card-theme"

export function ErrorCard({ data, t }: { data: CardData; t: TelegramTranslator }) {
  return (
    <BaseCard eyebrow={data.eyebrow ?? "WISEVEO"} headline={data.headline || t("cards.couldNotAnswer")}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
          padding: 28,
          borderRadius: 20,
          backgroundColor: cardTheme.panel,
          border: `1px solid ${cardTheme.border}`,
        }}
      >
        <div style={{ color: cardTheme.negative, fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          {t("cards.somethingIncomplete")}
        </div>
        <div style={{ color: cardTheme.muted, fontSize: 22, lineHeight: 1.35 }}>
          {data.insight ?? t("cards.tryRephrasing")}
        </div>
      </div>
    </BaseCard>
  )
}
