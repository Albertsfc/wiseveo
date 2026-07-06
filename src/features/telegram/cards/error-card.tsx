import type { CardData } from "../types/telegram.types"
import { BaseCard } from "./base-card"
import { cardTheme } from "./card-theme"

export function ErrorCard({ data }: { data: CardData }) {
  return (
    <BaseCard eyebrow={data.eyebrow ?? "WISEVEO"} headline={data.headline || "Nao consegui responder"}>
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
          Algo ficou incompleto
        </div>
        <div style={{ color: cardTheme.muted, fontSize: 22, lineHeight: 1.35 }}>
          {data.insight ?? "Tente reformular a pergunta com um periodo, conta ou categoria."}
        </div>
      </div>
    </BaseCard>
  )
}
