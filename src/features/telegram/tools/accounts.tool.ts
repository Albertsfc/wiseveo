import { tool } from "ai"
import { z } from "zod"
import { getAccountsWithBalance } from "@/features/accounts/services/get-accounts"
import { formatMoney, parseToolDate } from "./tool-utils"
import { endOfUTCDay } from "@/lib/financial"

export function createAccountBalancesTool(userId: string) {
  return tool({
    description:
      "Retorna os saldos atuais ou saldos ate uma data de todas as contas ativas do usuario.",
    inputSchema: z.object({
      toDate: z.string().optional().describe("Data limite no formato YYYY-MM-DD. Padrao: agora."),
    }),
    execute: async ({ toDate }) => {
      const cutoff = toDate ? parseToolDate(toDate, endOfUTCDay(new Date()), "end") : undefined
      const accounts = await getAccountsWithBalance(userId, cutoff)
      const totalBalance = accounts.reduce((sum, account) => sum + account.currentBalance, 0)

      return {
        asOf: cutoff?.toISOString() ?? new Date().toISOString(),
        totalBalance,
        formattedTotalBalance: formatMoney(totalBalance),
        accounts: accounts.map((account) => ({
          id: account.id,
          name: account.name,
          type: account.type,
          initialBalance: account.initialBalance,
          formattedInitialBalance: formatMoney(account.initialBalance),
          currentBalance: account.currentBalance,
          formattedCurrentBalance: formatMoney(account.currentBalance),
        })),
      }
    },
  })
}
