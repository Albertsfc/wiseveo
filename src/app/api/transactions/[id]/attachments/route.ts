import { NextResponse, type NextRequest } from "next/server"
import { getTranslations } from "next-intl/server"

import { prisma } from "@/lib/prisma"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3 MB
const ALLOWED_MIME = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
]

// POST /api/transactions/[id]/attachments
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const t = await getTranslations("api")
    const userId = await getDefaultUserId()
    if (!userId) {
        return NextResponse.json({ error: t("errors.userNotFound") }, { status: 401 })
    }

    const { id: transactionId } = await params

    // Verify the transaction belongs to this user
    const transaction = await prisma.transaction.findFirst({
        where: { id: transactionId, userId },
        select: { id: true },
    })
    if (!transaction) {
        return NextResponse.json({ error: t("errors.transactionNotFound") }, { status: 404 })
    }

    let formData: FormData
    try {
        formData = await request.formData()
    } catch {
        return NextResponse.json({ error: t("transactions.invalidFormData") }, { status: 400 })
    }

    const files = formData.getAll("files") as File[]
    if (!files || files.length === 0) {
        return NextResponse.json({ error: t("transactions.noFilesUploaded") }, { status: 400 })
    }

    const saved: { id: string; fileName: string; mimeType: string; fileSize: number }[] = []
    const errors: string[] = []

    for (const file of files) {
        // Validate type
        if (!ALLOWED_MIME.includes(file.type)) {
            errors.push(t("transactions.fileTypeNotAllowed", { fileName: file.name }))
            continue
        }
        // Validate size
        if (file.size > MAX_FILE_SIZE) {
            errors.push(t("transactions.fileTooLarge", { fileName: file.name }))
            continue
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        const attachment = await prisma.transactionAttachment.create({
            data: {
                id: crypto.randomUUID(),
                transactionId,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                fileData: buffer,
            },
            select: { id: true, fileName: true, mimeType: true, fileSize: true },
        })
        saved.push(attachment)
    }

    return NextResponse.json(
        { saved, errors: errors.length > 0 ? errors : undefined },
        { status: 201 }
    )
}

// GET /api/transactions/[id]/attachments
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const t = await getTranslations("api.errors")
    const userId = await getDefaultUserId()
    if (!userId) {
        return NextResponse.json({ error: t("userNotFound") }, { status: 401 })
    }

    const { id: transactionId } = await params

    const transaction = await prisma.transaction.findFirst({
        where: { id: transactionId, userId },
        select: { id: true },
    })
    if (!transaction) {
        return NextResponse.json({ error: t("transactionNotFound") }, { status: 404 })
    }

    const attachments = await prisma.transactionAttachment.findMany({
        where: { transactionId },
        select: { id: true, fileName: true, mimeType: true, fileSize: true, createdAt: true },
        orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ attachments })
}
