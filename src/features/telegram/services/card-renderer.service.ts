import fs from "node:fs/promises"
import path from "node:path"
import { createElement } from "react"
import satori from "satori"
import { Resvg } from "@resvg/resvg-js"
import { CategoryCard } from "../cards/category-card"
import { CARD_SIZE } from "../cards/card-theme"
import { ErrorCard } from "../cards/error-card"
import { ListCard } from "../cards/list-card"
import { SingleValueCard } from "../cards/single-value-card"
import { SummaryCard } from "../cards/summary-card"
import type { CardData } from "../types/telegram.types"

let cachedFont: ArrayBuffer | null = null

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
}

async function readFirstAvailableFont(paths: string[]) {
  for (const fontPath of paths) {
    try {
      const data = await fs.readFile(fontPath)
      return bufferToArrayBuffer(data)
    } catch {
      // Try next candidate.
    }
  }

  return null
}

async function loadCardFont() {
  if (cachedFont) return cachedFont

  const candidates = [
    process.env.TELEGRAM_CARD_FONT_PATH,
    path.join(
      process.cwd(),
      "node_modules",
      "next",
      "dist",
      "compiled",
      "@vercel",
      "og",
      "noto-sans-v27-latin-regular.ttf",
    ),
    path.join(process.cwd(), "node_modules", "next", "dist", "next-devtools", "server", "font", "geist-latin.woff2"),
    "C:\\Windows\\Fonts\\arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  ].filter(Boolean) as string[]

  cachedFont = await readFirstAvailableFont(candidates)

  if (!cachedFont) {
    throw new Error("No compatible font found for Telegram card rendering")
  }

  return cachedFont
}

function renderCard(data: CardData) {
  if (data.type === "list") return createElement(ListCard, { data })
  if (data.type === "category" || data.type === "comparison") return createElement(CategoryCard, { data })
  if (data.type === "single-value") return createElement(SingleValueCard, { data })
  if (data.type === "error") return createElement(ErrorCard, { data })

  return createElement(SummaryCard, { data })
}

function resolveCardSize(data: CardData) {
  if (data.type !== "list") return CARD_SIZE

  const itemCount = Math.min(data.items?.length ?? 0, 4)
  return {
    width: CARD_SIZE.width,
    height: itemCount > 3 || data.insight ? 520 : 460,
  }
}

export async function generateCardImage(data: CardData): Promise<Buffer> {
  const fontData = await loadCardFont()
  const cardSize = resolveCardSize(data)
  const svg = await satori(renderCard(data), {
    width: cardSize.width,
    height: cardSize.height,
    fonts: [
      { name: "Noto Sans", data: fontData, weight: 400, style: "normal" },
      { name: "Noto Sans", data: fontData, weight: 700, style: "normal" },
    ],
  })

  const resvg = new Resvg(svg, {
    background: "transparent",
    fitTo: { mode: "width", value: cardSize.width },
  })

  return Buffer.from(resvg.render().asPng())
}
