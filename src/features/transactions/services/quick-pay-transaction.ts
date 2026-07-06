import { getUserQuickPaymentSettings } from "@/features/settings/services/user-settings-service"
import { prisma } from "@/lib/prisma"

interface QuickPayResult {
  success: boolean
  error?: string
}

export async function quickPayTransaction(
  id: string,
  userId: string
): Promise<QuickPayResult> {
  const quickPayment = await getUserQuickPaymentSettings(userId)

  if (
    quickPayment.defaultAccountId === null ||
    quickPayment.defaultStatusCode === null
  ) {
    return {
      success: false,
      error:
        "Configure os padrões de Pagamento Rápido em Configurações > Geral antes de usar esta função.",
    }
  }

  const [account, status, tx] = await Promise.all([
    prisma.account.findFirst({
      where: {
        id: quickPayment.defaultAccountId,
        userId,
        active: true,
      },
      select: { id: true },
    }),
    prisma.transactionStatusLookup.findFirst({
      where: {
        code: quickPayment.defaultStatusCode,
        userId,
      },
      select: { code: true },
    }),
    prisma.transaction.findFirst({
      where: { id, userId },
      select: { id: true },
    }),
  ])

  if (!account || !status) {
    return {
      success: false,
      error:
        "Os padrões de Pagamento Rápido salvos não são mais válidos. Atualize Configurações > Geral antes de continuar.",
    }
  }

  if (!tx) return { success: false, error: "Transação não encontrada" }

  await prisma.transaction.update({
    where: { id },
    data: {
      accountId: quickPayment.defaultAccountId,
      statusCode: quickPayment.defaultStatusCode,
    },
  })

  return { success: true }
}
