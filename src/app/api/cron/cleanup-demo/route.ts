import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Guard: only run in demo environment — no-op in the real app project
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return NextResponse.json({ skipped: true, reason: "Demo mode is disabled" }, { status: 200 })
  }

  // Security: Vercel Cron sends Authorization header with CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Delete phantom users created more than 4 hours ago.
    // Safety double-guard: email MUST start with "demo_" — never touches real users.
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
