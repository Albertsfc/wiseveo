import { NextResponse, type NextRequest } from "next/server"

import { prisma } from "@/lib/prisma"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const userId = await getDefaultUserId()
  if (!userId) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 })
  }

  const { id: transactionId, attachmentId } = await params

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    select: { id: true },
  })
  if (!transaction) {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
  }

  const attachment = await prisma.transactionAttachment.findFirst({
    where: { id: attachmentId, transactionId },
    select: { fileData: true, mimeType: true, fileName: true, fileSize: true },
  })
  if (!attachment) {
    return NextResponse.json({ error: "Anexo não encontrado" }, { status: 404 })
  }

  const shouldDownload = request.nextUrl.searchParams.get("download") === "1"
  const disposition = shouldDownload ? "attachment" : "inline"
  const safeFileName = attachment.fileName.replace(/"/g, "")

  return new NextResponse(Buffer.from(attachment.fileData), {
    status: 200,
    headers: {
      "Content-Type": attachment.mimeType || "application/octet-stream",
      "Content-Length": String(attachment.fileSize),
      "Content-Disposition": `${disposition}; filename="${safeFileName}"`,
      "Cache-Control": "private, max-age=60",
    },
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const userId = await getDefaultUserId()
  if (!userId) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 })
  }

  const { id: transactionId, attachmentId } = await params

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    select: { id: true },
  })
  if (!transaction) {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
  }

  const attachment = await prisma.transactionAttachment.findFirst({
    where: { id: attachmentId, transactionId },
    select: { id: true },
  })
  if (!attachment) {
    return NextResponse.json({ error: "Anexo não encontrado" }, { status: 404 })
  }

  await prisma.transactionAttachment.delete({
    where: { id: attachmentId },
  })

  return NextResponse.json({ success: true })
}
