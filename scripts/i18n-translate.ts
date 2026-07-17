import fs from "fs"
import os from "os"
import path from "path"
import dotenv from "dotenv"
import { generateText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"

// This script runs standalone via `tsx` (not through Next.js or the Prisma
// CLI), so .env* files are not auto-loaded — load them explicitly. .env.local
// wins over .env for anything defined in both (dotenv never overrides values
// already present in process.env).
const envLocalPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath })
}
dotenv.config()

const DIR = path.join(process.cwd(), "src/i18n/messages")
const BASE_LOCALE = "pt-BR"
const TARGET_LOCALES = ["en-US", "es-419"] as const
// Batch size per model call: keeps each response comfortably below the output
// token budget, so a large sweep of missing keys can't be silently truncated.
const CHUNK_SIZE = 40
type TargetLocale = (typeof TARGET_LOCALES)[number]

const TARGET_LANGUAGE_LABEL: Record<TargetLocale, string> = {
  "en-US": "inglês americano",
  "es-419": "espanhol latino-americano (es-419)",
}

const GLOSSARY = `Glossário obrigatório (pt → en / es):
Lançamento(s) → Transaction(s) / Movimiento(s); Saldo → Balance / Saldo;
Receitas/Entradas → Income/Inflows / Ingresos/Entradas; Despesas/Saídas → Expenses/Outflows / Gastos/Salidas;
Vencimento → Due date / Vencimiento; Recorrente → Recurring / Recurrente;
Orçamento → Budget / Presupuesto; Previsão → Forecast / Pronóstico; Conta → Account / Cuenta.
Tom: interface de app financeiro, conciso. Preserve placeholders ICU {assim} e a sintaxe {count, plural, ...} intactos.`

type Tree = { [k: string]: Tree | string }

// --- file helpers ---------------------------------------------------------

function readTree(file: string): Tree {
  const filePath = path.join(DIR, file)
  const content = fs.readFileSync(filePath, "utf-8")
  return JSON.parse(content) as Tree
}

function writeTree(file: string, tree: Tree): void {
  const filePath = path.join(DIR, file)
  const json = JSON.stringify(sortTree(tree), null, 2)
  fs.writeFileSync(filePath, `${json}\n`, "utf-8")
}

// --- tree helpers ----------------------------------------------------------

function flat(tree: Tree, prefix = "", out: Map<string, string> = new Map()): Map<string, string> {
  for (const key of Object.keys(tree)) {
    const value = tree[key]
    const dotKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === "object" && value !== null) {
      flat(value, dotKey, out)
    } else {
      out.set(dotKey, String(value))
    }
  }
  return out
}

function setDeep(tree: Tree, dotKey: string, value: string, target: string): void {
  const parts = dotKey.split(".")
  let node = tree
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    const existing = node[part]
    if (existing === undefined) {
      node[part] = {}
    } else if (typeof existing !== "object" || existing === null) {
      // The target file has a LEAF (string) where pt-BR has a BRANCH (object).
      // Silently replacing it would destroy an existing translation — abort so
      // a human resolves the structural divergence first.
      const conflictPath = parts.slice(0, i + 1).join(".")
      console.error(
        `❌ Conflito de estrutura em ${target}: ${conflictPath} é folha no alvo mas objeto no pt-BR`
      )
      process.exit(1)
    }
    node = node[part] as Tree
  }
  node[parts[parts.length - 1]] = value
}

function sortTree(tree: Tree): Tree {
  const sorted: Tree = {}
  for (const key of Object.keys(tree).sort()) {
    const value = tree[key]
    sorted[key] = typeof value === "object" && value !== null ? sortTree(value) : value
  }
  return sorted
}

// --- model call --------------------------------------------------------

function stripFences(text: string): string {
  const trimmed = text.trim()
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenceMatch ? fenceMatch[1].trim() : trimmed
}

function buildPrompt(target: TargetLocale, missing: Record<string, string>): string {
  return `Traduza os VALORES do objeto JSON abaixo do português (pt-BR) para ${TARGET_LANGUAGE_LABEL[target]}.

${GLOSSARY}

Regras obrigatórias:
- Responda APENAS com um objeto JSON válido — sem markdown, sem comentários, sem texto fora do JSON.
- As chaves do JSON de resposta devem ser EXATAMENTE as mesmas chaves recebidas (mesmo dot-notation), uma tradução por chave.
- Traduza somente os valores. NUNCA traduza nomes de placeholders ICU (ex: {count}, {name}) nem a sintaxe de plural
  ({count, plural, one {...} other {...}}) — preserve-os caractere por caractere.

JSON de entrada (chave: texto em pt-BR a traduzir):
${JSON.stringify(missing, null, 2)}`
}

async function translateMissing(
  target: TargetLocale,
  missing: Record<string, string>
): Promise<Record<string, string>> {
  const { text } = await generateText({
    model: anthropic("claude-sonnet-5"),
    system:
      "Você é um tradutor especializado em localização de interfaces de software financeiro. Responda sempre com JSON válido, nunca com explicações ou markdown.",
    prompt: buildPrompt(target, missing),
    maxOutputTokens: 8192,
  })

  const cleaned = stripFences(text)
  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch (err) {
    failOnUnparsableResponse(target, text, (err as Error).message)
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    failOnUnparsableResponse(target, text, "resposta não é um objeto JSON")
  }

  return parsed as Record<string, string>
}

function failOnUnparsableResponse(target: TargetLocale, rawText: string, reason: string): never {
  const dumpPath = path.join(os.tmpdir(), `i18n-translate-${target}-${Date.now()}.txt`)
  fs.writeFileSync(dumpPath, rawText, "utf-8")
  console.error(`❌ ${target}: resposta do modelo não é um JSON válido (${reason}).`)
  console.error(`   Resposta bruta salva em: ${dumpPath}`)
  console.error(`   Nenhum arquivo de mensagens foi alterado.`)
  process.exit(1)
}

// --- per-locale flow ---------------------------------------------------

async function processTarget(target: TargetLocale, baseFlat: Map<string, string>): Promise<void> {
  const file = `${target}.json`
  const targetTree = readTree(file)
  const targetFlat = flat(targetTree)

  const missingKeys = [...baseFlat.keys()].filter((key) => !targetFlat.has(key))

  if (missingKeys.length === 0) {
    console.log(`✅ ${target}: nada faltando`)
    return
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ Defina ANTHROPIC_API_KEY no ambiente/.env para usar a tradução assistida")
    process.exit(1)
  }

  // Translate in batches of CHUNK_SIZE keys: one model call per batch, merging
  // the results. A single call over hundreds of keys risks hitting the output
  // token budget and getting a truncated (unparseable) JSON response.
  const chunks: string[][] = []
  for (let i = 0; i < missingKeys.length; i += CHUNK_SIZE) {
    chunks.push(missingKeys.slice(i, i + CHUNK_SIZE))
  }

  const translated: Record<string, string> = {}
  for (let i = 0; i < chunks.length; i++) {
    console.log(`🔎 ${target}: lote ${i + 1}/${chunks.length}`)
    const chunkSource: Record<string, string> = {}
    for (const key of chunks[i]) {
      chunkSource[key] = baseFlat.get(key)!
    }
    Object.assign(translated, await translateMissing(target, chunkSource))
  }

  // Only ever write keys that were actually missing — existing translations
  // in the target file are never touched/overwritten.
  let appliedCount = 0
  const stillMissing: string[] = []
  for (const key of missingKeys) {
    const value = translated[key]
    if (typeof value === "string" && value.trim() !== "") {
      setDeep(targetTree, key, value, target)
      appliedCount++
    } else {
      stillMissing.push(key)
    }
  }

  writeTree(file, targetTree)

  if (stillMissing.length > 0) {
    console.warn(
      `⚠️  ${target}: ${stillMissing.length} chave(s) não vieram na resposta do modelo: ${stillMissing.join(", ")}`
    )
  }
  console.log(`✍️  ${target}: ${appliedCount} chaves traduzidas — REVISE o diff antes de commitar`)
}

async function main() {
  const baseFile = `${BASE_LOCALE}.json`
  if (!fs.existsSync(path.join(DIR, baseFile))) {
    console.error(`❌ Arquivo base não encontrado: ${baseFile}`)
    process.exit(1)
  }

  const baseFlat = flat(readTree(baseFile))

  for (const target of TARGET_LOCALES) {
    await processTarget(target, baseFlat)
  }
}

main().catch((err) => {
  console.error("❌ Erro inesperado ao rodar a tradução assistida:", err)
  process.exit(1)
})
