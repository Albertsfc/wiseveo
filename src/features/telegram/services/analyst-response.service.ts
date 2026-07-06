import { generateText } from "ai"
import { getLlmModels } from "./llm-models"
import type { ClassifiedQuery } from "./query-classifier.service"
import type { DispatchResult } from "./tool-dispatcher.service"

export async function generateAnalystResponse(
  userQuery: string,
  classified: ClassifiedQuery,
  dispatched: DispatchResult,
): Promise<string> {
  const [model] = getLlmModels()

  const dataStr = JSON.stringify(dispatched.data, null, 2)

  const { text } = await generateText({
    model,
    system: `Você é um Analista Financeiro Senior do WISEVEO. 
Seu trabalho é interpretar os dados financeiros fornecidos e responder à pergunta do usuário de forma clara, assertiva e natural.

DIRETRIZES:
- Se o usuário perguntar "Qual mês...", "Quando...", identifique o mês com maior/menor valor nos dados fornecidos.
- Se houver uma tendência (ex: gastos aumentando), mencione-a brevemente.
- Use um tom profissional mas amigável.
- Responda SEMPRE em Português do Brasil (PT-BR).
- Mantenha a resposta concisa e direta ao ponto.
- Se os dados (history) estiverem vazios, informe gentilmente que não encontrou registros para essa análise no período (últimos 12 meses por padrão).
- Não invente dados ou meses. Use apenas o que consta em "DADOS DA ANÁLISE".
- Se houver nomes de pessoas (ex: "Faby"), use o nome na resposta para ser mais pessoal.

DADOS DA ANÁLISE (Agregados Mensais):
${dataStr}`,
    prompt: `Pergunta do Usuário: "${userQuery}"`,
  })

  return text.trim()
}
