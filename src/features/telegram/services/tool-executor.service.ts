import type { ToolExecutionOptions } from "ai"
import { getTools } from "../tools"

interface ExecutableTelegramTool {
  execute?: (input: unknown, options: ToolExecutionOptions) => unknown | Promise<unknown>
}

export function createTelegramToolSet(userId: string) {
  return getTools(userId)
}

export async function executeTelegramTool(userId: string, toolName: string, input: unknown) {
  const tools = getTools(userId) as Record<string, ExecutableTelegramTool>
  const selectedTool = tools[toolName]

  if (!selectedTool?.execute) {
    throw new Error(`Telegram tool not found: ${toolName}`)
  }

  return selectedTool.execute(input, {
    toolCallId: `telegram-${toolName}`,
    messages: [],
  })
}
