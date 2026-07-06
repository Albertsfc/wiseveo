import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma_new/client"
import { createSessionToken, COOKIE_NAME } from "@/lib/auth"
import {
  getInitialUserAccess,
  isActiveUser,
  normalizeEmail,
  PENDING_APPROVAL_PATH,
} from "@/lib/user-approval"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()
    const normalizedName = typeof name === "string" ? name.trim() : ""
    const normalizedEmail = typeof email === "string" ? normalizeEmail(email) : ""

    if (!normalizedName || !normalizedEmail || !password) {
      return NextResponse.json(
        { success: false, message: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Senha deve ter pelo menos 8 caracteres" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { status: true },
    })

    if (existingUser) {
      if (!isActiveUser(existingUser.status)) {
        return NextResponse.json(
          {
            success: true,
            message: "Seu cadastro já está aguardando aprovação.",
            redirectTo: PENDING_APPROVAL_PATH,
          },
          { status: 200 }
        )
      }

      return NextResponse.json(
        { success: false, message: "Esse email já foi registrado" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const initialAccess = getInitialUserAccess(normalizedEmail)

    const userCount = await prisma.user.count()
    const isFirstUser = userCount === 0

    const newUser = await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        passwordHash: hashedPassword,
        role: isFirstUser ? "SUPERADMIN" : initialAccess.role,
        status: isFirstUser ? "ACTIVE" : initialAccess.status,
      },
    })

    const { initializeUserData } = await import("@/lib/user-init")
    await initializeUserData(newUser.id)

    if (!isActiveUser(newUser.status)) {
      return NextResponse.json(
        {
          success: true,
          message: "Cadastro recebido. Aguarde a aprovação de um administrador.",
          redirectTo: PENDING_APPROVAL_PATH,
        },
        { status: 201 }
      )
    }

    const token = await createSessionToken(newUser.id)

    const response = NextResponse.json(
      { success: true, message: "Conta criada com sucesso" },
      { status: 201 }
    )

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return response
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { success: false, message: "Esse email já foi registrado" },
          { status: 409 }
        )
      }
    }

    console.error("[POST /api/auth/signup] erro:", error)

    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
