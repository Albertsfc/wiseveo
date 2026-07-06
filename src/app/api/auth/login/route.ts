import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createSessionToken, COOKIE_NAME } from "@/lib/auth"
import {
  isActiveUser,
  normalizeEmail,
  PENDING_APPROVAL_PATH,
} from "@/lib/user-approval"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const normalizedEmail = typeof email === "string" ? normalizeEmail(email) : ""

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { success: false, message: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Email ou senha incorretos" },
        { status: 401 }
      )
    }

    if (!user.passwordHash) {
      if (!isActiveUser(user.status)) {
        return NextResponse.json(
          {
            success: true,
            message: "Seu cadastro ainda está aguardando aprovação.",
            redirectTo: PENDING_APPROVAL_PATH,
          },
          { status: 200 }
        )
      }

      return NextResponse.json(
        { success: false, message: "Esta conta usa login pelo Google. Clique em 'Continuar com Google'." },
        { status: 401 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Email ou senha incorretos" },
        { status: 401 }
      )
    }

    if (!isActiveUser(user.status)) {
      return NextResponse.json(
        {
          success: true,
          message: "Seu cadastro ainda está aguardando aprovação.",
          redirectTo: PENDING_APPROVAL_PATH,
        },
        { status: 200 }
      )
    }

    const token = await createSessionToken(user.id)
    const isNewSetup = request.cookies.has("wiseveo-new-setup")
    const redirectTo = isNewSetup ? "/configuracoes?onboarding=true" : undefined

    const response = NextResponse.json(
      { success: true, message: "Login realizado com sucesso", redirectTo },
      { status: 200 }
    )

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    })

    if (isNewSetup) {
      response.cookies.delete("wiseveo-new-setup")
    }

    return response
  } catch {
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
