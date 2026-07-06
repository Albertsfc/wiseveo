import { NextResponse, type NextRequest } from "next/server"

import { prisma } from "@/lib/prisma"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"

const MAX_MESSAGE_LENGTH = 2000

// GET /api/transactions/[id]/messages
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getDefaultUserId()
  if (!userId) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 })
  }

  const { id: transactionId } = await params

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    select: { id: true },
  })

  if (!transaction) {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
  }

  try {
    const rows = await prisma.$queryRaw<
      Array<{
        id: string
        content: string
        createdAt: Date
        userId: string
        userName: string
      }>
    >`
      SELECT
        tm.id,
        tm.content,
        tm.created_at AS "createdAt",
        u.id AS "userId",
        u.name AS "userName"
      FROM public.transaction_messages tm
      INNER JOIN public.users u ON u.id = tm.user_id
      WHERE tm.transaction_id = ${transactionId}
      ORDER BY tm.created_at ASC
    `

    const messages = rows.map((row) => ({
      id: row.id,
      content: row.content,
      createdAt: row.createdAt,
      user: {
        id: row.userId,
        name: row.userName,
      },
    }))

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error loading transaction messages:", error)
    return NextResponse.json({ error: "Erro ao carregar mensagens" }, { status: 500 })
  }
}

// POST /api/transactions/[id]/messages
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getDefaultUserId()
  if (!userId) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 })
  }

  const { id: transactionId } = await params

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    select: { id: true },
  })

  if (!transaction) {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const content = typeof body.content === "string" ? body.content.trim() : ""

  if (!content) {
    return NextResponse.json({ error: "Mensagem não pode estar vazia" }, { status: 400 })
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Mensagem deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres` },
      { status: 400 }
    )
  }

  try {
    const messageId = crypto.randomUUID()
    const rows = await prisma.$queryRaw<
      Array<{
        id: string
        content: string
        createdAt: Date
        userId: string
        userName: string
      }>
    >`
      WITH inserted AS (
        INSERT INTO public.transaction_messages (
          id,
          transaction_id,
          user_id,
          content,
          created_at,
          updated_at
        )
        VALUES (
          ${messageId},
          ${transactionId},
          ${userId},
          ${content},
          NOW(),
          NOW()
        )
        RETURNING id, content, created_at, user_id
      )
      SELECT
        i.id,
        i.content,
        i.created_at AS "createdAt",
        u.id AS "userId",
        u.name AS "userName"
      FROM inserted i
      INNER JOIN public.users u ON u.id = i.user_id
    `

    const row = rows[0]
    if (!row) {
      return NextResponse.json({ error: "Erro ao salvar mensagem" }, { status: 500 })
    }

    const message = {
      id: row.id,
      content: row.content,
      createdAt: row.createdAt,
      user: {
        id: row.userId,
        name: row.userName,
      },
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error("Error creating transaction message:", error)
    return NextResponse.json({ error: "Erro ao salvar mensagem" }, { status: 500 })
  }
}
