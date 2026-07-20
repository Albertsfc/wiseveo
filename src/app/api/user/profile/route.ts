import { NextResponse } from "next/server"
import { getTranslations } from "next-intl/server"
import { Prisma } from "@/generated/prisma_new/client"
import { prisma } from "@/lib/prisma"
import { getSessionUserId } from "@/lib/session"

type JsonRecord = Record<string, unknown>

function ensureJsonRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : {}
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

export async function GET() {
  const t = await getTranslations("api.errors")
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json(
      { success: false, message: t("notAuthenticated") },
      { status: 401 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      photo: true,
      phone: true,
      preferencesJson: true,
      role: true,
      status: true,
    },
  })

  if (!user) {
    return NextResponse.json(
      { success: false, message: t("userNotFound") },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.photo || "",
      role: user.role,
      status: user.status,
    },
  })
}

export async function PUT(request: Request) {
  const t = await getTranslations("api.errors")
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json(
      { success: false, message: t("notAuthenticated") },
      { status: 401 }
    )
  }

  try {
    const body = ensureJsonRecord(await request.json())
    const { firstName, lastName, email, phone, ...extraPrefs } = body
    const safeFirstName = typeof firstName === "string" ? firstName : ""
    const safeLastName = typeof lastName === "string" ? lastName : ""
    const safeEmail = typeof email === "string" ? email : ""
    const safePhone = typeof phone === "string" ? phone : ""

    const name = `${safeFirstName} ${safeLastName}`.trim()

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        email: safeEmail || undefined,
        phone: safePhone || undefined,
        preferencesJson: toInputJsonValue({
          ...(await getUserPreferences(userId)),
          profile: extraPrefs,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    const tUser = await getTranslations("api.user")
    const message =
      error instanceof Error ? error.message : tUser("updateProfileFailed")

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}

async function getUserPreferences(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferencesJson: true },
  })
  return ensureJsonRecord(user?.preferencesJson)
}
