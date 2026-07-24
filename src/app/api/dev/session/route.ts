import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSessionToken, COOKIE_NAME } from "@/lib/auth"
import { normalizeEmail } from "@/lib/user-approval"

export const dynamic = "force-dynamic"

/**
 * DEV-ONLY login bypass — emite um cookie de sessão para um usuário já
 * existente, sem senha, para agilizar testes locais (não precisar logar a
 * cada preview). NUNCA cria dados: apenas assina uma sessão para uma conta
 * que já existe no banco.
 *
 * Blindagem (qualquer falha responde 404 — indistinguível de rota inexistente,
 * zero pegada em produção):
 *   1. NODE_ENV === "production"  → 404. Builds da Vercel são sempre production,
 *      logo a rota está MORTA em prod mesmo que as envs abaixo vazem junto.
 *   2. DEV_AUTOLOGIN !== "1"      → 404. Precisa ser ligada explicitamente no
 *      .env.local (gitignored).
 *   3. DEV_SESSION_EMAIL ausente  → 404. O alvo nunca é hardcoded no código.
 *   4. Usuário inexistente/inativo → 404.
 *
 * Todas as respostas de recusa usam 404 sem corpo, de propósito.
 */

function notFound() {
  return new NextResponse(null, { status: 404 })
}

export async function GET(request: Request) {
  // Guarda 1: morto em produção, sempre.
  if (process.env.NODE_ENV === "production") return notFound()
  // Guarda 2: precisa ser ligado explicitamente (opt-in local).
  if (process.env.DEV_AUTOLOGIN !== "1") return notFound()

  // Guarda 3: alvo vem só da env, nunca do código versionado.
  const rawEmail = process.env.DEV_SESSION_EMAIL
  if (!rawEmail) return notFound()
  const email = normalizeEmail(rawEmail)
  if (!email) return notFound()

  // Guarda 4: só assina sessão para uma conta que já existe e está ativa.
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.status !== "ACTIVE") return notFound()

  const token = await createSessionToken(user.id)

  const response = NextResponse.redirect(new URL("/dashboard", request.url))
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    // Rota exclusiva de dev (as guardas acima já barram produção): serve sobre
    // http://localhost, onde secure:true impediria o cookie de ser gravado.
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: "/",
  })
  return response
}
