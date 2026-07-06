import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { normalizeDate, periodFromDate, isValidPeriod } from "@/lib/financial"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getDefaultUserId()

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const data = { ...body } as Record<string, unknown>
    const isUpdatingLastDate =
        typeof data.lastDate === "string" && data.lastDate.trim().length > 0

    if (isUpdatingLastDate) {
        const nextLastDate = normalizeDate(String(data.lastDate))
        data.lastDate = nextLastDate
        data.period = periodFromDate(nextLastDate)
    }

    if (!isUpdatingLastDate && Object.prototype.hasOwnProperty.call(data, "period")) {
        const p = data.period
        if (typeof p !== "string" || !isValidPeriod(p)) {
            return NextResponse.json(
                { error: "Período inválido (esperado YYYYMM)" },
                { status: 400 }
            )
        }
    }

    // Sanitize text fields
    if (typeof data.note === "string") data.note = data.note.trim() || null
    if (typeof data.description === "string") data.description = data.description.trim() || null
    if (typeof data.reference === "string") data.reference = data.reference.trim() || null

    const hasPayeeIdField = Object.prototype.hasOwnProperty.call(data, "payeeId")
    const hasPayeeNameField = Object.prototype.hasOwnProperty.call(data, "payeeName")

    if (hasPayeeIdField || hasPayeeNameField) {
        const payeeName =
            typeof data.payeeName === "string" ? data.payeeName.trim() : ""
        const incomingPayeeId =
            typeof data.payeeId === "number" ? data.payeeId : null

        let resolvedPayeeId: number | null = null

        if (incomingPayeeId) {
            const existingPayee = await prisma.payee.findFirst({
                where: { id: incomingPayeeId, userId },
                select: { id: true },
            })
            resolvedPayeeId = existingPayee?.id ?? null
        } else if (payeeName) {
            const existingByName = await prisma.payee.findFirst({
                where: {
                    userId,
                    name: { equals: payeeName, mode: "insensitive" },
                },
                select: { id: true },
            })

            if (existingByName) {
                resolvedPayeeId = existingByName.id
            } else {
                const nextIdResult = await prisma.$queryRaw<Array<{ next_id: number }>>`
                    SELECT COALESCE(MAX("COD_BEN"), 0) + 1 AS next_id
                    FROM payees
                `
                const nextPayeeId = Number(nextIdResult[0]?.next_id ?? 1)
                const createdPayee = await prisma.payee.create({
                    data: {
                        id: nextPayeeId,
                        name: payeeName,
                        userId,
                    },
                    select: { id: true },
                })
                resolvedPayeeId = createdPayee.id
            }
        }

        data.payeeId = resolvedPayeeId
        delete data.payeeName
    }

    const existing = await prisma.recurringTransaction.findFirst({
        where: { id, userId },
        select: { id: true },
    })

    if (!existing) {
        return NextResponse.json({ error: "Recorrência não encontrada" }, { status: 404 })
    }

    const recurring = await prisma.recurringTransaction.update({
        where: { id },
        data,
        include: {
            payee: { select: { id: true, name: true } },
        },
    })

    return NextResponse.json(recurring)
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getDefaultUserId()

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.recurringTransaction.findFirst({
        where: { id, userId },
        select: { id: true },
    })

    if (!existing) {
        return NextResponse.json({ error: "Recorrência não encontrada" }, { status: 404 })
    }

    await prisma.recurringTransaction.delete({
        where: { id },
    })

    return NextResponse.json({ success: true })
}
