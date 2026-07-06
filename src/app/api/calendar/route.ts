import { NextResponse, type NextRequest } from "next/server"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { getCalendarStatement } from "@/features/calendar/services/get-calendar-statement"
import { startOfUTCDay, endOfUTCDay } from "@/lib/financial"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  if (!fromParam || !toParam) {
    return NextResponse.json(
      { error: "Parâmetros 'from' e 'to' são obrigatórios" },
      { status: 400 },
    )
  }

  const from = startOfUTCDay(fromParam)
  const to = endOfUTCDay(toParam)

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: "Datas inválidas" }, { status: 400 })
  }

  const userId = await getDefaultUserId()

  if (!userId) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 401 },
    )
  }

  const data = await getCalendarStatement(userId, from, to)

  return NextResponse.json(data)
}
