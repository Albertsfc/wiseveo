import { getTranslations } from "next-intl/server"
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
  const t = await getTranslations("transactions.services.quickPay")
  const quickPayment = await getUserQuickPaymentSettings(userId)

  if (
    quickPayment.defaultAccountId === null ||
    quickPayment.defaultStatusCode === null
  ) {
    return {
      success: false,
      error: t("missingDefaults"),
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
      error: t("invalidDefaults"),
    }
  }

  if (!tx) return { success: false, error: t("transactionNotFound") }

  await prisma.transaction.update({
    where: { id },
    data: {
      accountId: quickPayment.defaultAccountId,
      statusCode: quickPayment.defaultStatusCode,
    },
  })

  return { success: true }
}
