import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Segurança recomendada pela Vercel Cron
  // Em produção, a requisição DEVE vir com o CRON_SECRET no cabeçalho Authorization
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Apagar usuários cujo e-mail começa com demo_ E criados há mais de 4 horas
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000)

    const result = await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'demo_'
        },
        createdAt: {
          lt: fourHoursAgo
        }
      }
    })

    return NextResponse.json({
      success: true,
      deletedCount: result.count
    })
  } catch (error) {
    console.error("Cron Cleanup Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
