import { NextResponse, type NextRequest } from "next/server"
import { endOfMonth } from "date-fns"

import { createTransaction } from "@/features/transactions/services/create-transaction"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { getTransactions } from "@/features/transactions/services/get-transactions"
import { getAccountsWithBalance } from "@/features/accounts/services/get-accounts"
import { getFinancialSummary } from "@/features/shared/services/get-financial-summary"
import { startOfUTCDay, endOfUTCDay } from "@/lib/financial"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  if (!fromParam || !toParam) {
    return NextResponse.json(
      { error: "Parâmetros 'from' e 'to' são obrigatórios" },
      { status: 400 }
    )
  }

  const from = startOfUTCDay(fromParam)
  const to = endOfUTCDay(toParam)

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json(
      { error: "Datas inválidas" },
      { status: 400 }
    )
  }

  const userId = await getDefaultUserId()

  if (!userId) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 401 }
    )
  }

  const eom = endOfMonth(to)

  const [txData, balancesAtDate, balancesAtEndOfMonth, summary] =
    await Promise.all([
      getTransactions({ userId, from, to }),
      getAccountsWithBalance(userId, to),
      getAccountsWithBalance(userId, eom),
      getFinancialSummary(userId, from, to),
    ])

  return NextResponse.json({
    ...txData,
    balancesAtDate,
    balancesAtEndOfMonth,
    summary,
  })
}

export async function POST(request: NextRequest) {
  const userId = await getDefaultUserId()
  if (!userId) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 401 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "JSON inválido" },
      { status: 400 }
    )
  }

  const { date, amount, type, accountId, groupCode, categoryCode, statusCode } =
    body

  if (
    !date ||
    amount === undefined ||
    !type ||
    !accountId ||
    !groupCode ||
    !categoryCode ||
    !statusCode
  ) {
    return NextResponse.json(
      {
        error:
          "Campos obrigatórios: date, amount, type, accountId, groupCode, categoryCode, statusCode",
      },
      { status: 400 }
    )
  }

  if (!["INCOME", "EXPENSE", "TRANSFER"].includes(type as string)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
  }

  try {
    const transaction = await createTransaction({
      userId,
      date: String(date),
      period: body.period ? String(body.period) : undefined,
      reference: body.reference ? String(body.reference) : undefined,
      note: body.note ? String(body.note) : undefined,
      description: body.description ? String(body.description) : undefined,
      amount: Number(amount),
      type: type as "INCOME" | "EXPENSE" | "TRANSFER",
      accountId: Number(accountId),
      groupCode: Number(groupCode),
      categoryCode: String(categoryCode),
      statusCode: Number(statusCode),
      payeeId: body.payeeId ? Number(body.payeeId) : undefined,
      payeeName: body.payeeName ? String(body.payeeName) : undefined,
      destAccountId: body.destAccountId
        ? Number(body.destAccountId)
        : undefined,
    })

    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error("Error creating transaction:", error)
    return NextResponse.json(
      { error: "Erro ao criar transação" },
      { status: 500 }
    )
  }
}
