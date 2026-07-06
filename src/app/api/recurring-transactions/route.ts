import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { periodFromDate, isValidPeriod } from "@/lib/financial"

export async function GET() {
    const userId = await getDefaultUserId()

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const recurring = await prisma.recurringTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            account: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
            payee: { select: { id: true, name: true } },
        },
    })

    return NextResponse.json(recurring)
}

export async function POST(req: Request) {
    const userId = await getDefaultUserId()

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const period =
        body?.period && isValidPeriod(String(body.period))
            ? String(body.period)
            : periodFromDate(
                typeof body?.lastDate === "string" && body.lastDate
                    ? String(body.lastDate)
                    : undefined
            )

    // Minimal implementation for now to satisfy the structure
    const recurring = await prisma.recurringTransaction.create({
        data: {
            ...body,
            period,
            userId,
        }
    })

    return NextResponse.json(recurring)
}
