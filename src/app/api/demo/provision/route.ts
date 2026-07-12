import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { initializeUserData } from "@/lib/user-init"
import { createSessionToken, COOKIE_NAME } from "@/lib/auth"
import { defaultCategories, defaultGroups, defaultStatuses } from "../../../../../prisma/data/default-chart-of-accounts"

export const dynamic = 'force-dynamic'
// Increase max duration for provisioning (Vercel Hobby allows up to 60s on API routes)
export const maxDuration = 60

/**
 * Generates 300 mock transactions spread across Nov/2025–Aug/2026.
 *
 * Uses the phantom user's specific category codes (prefixed) and accountId
 * so every demo user's transactions are fully isolated in the DB.
 */
function generateTransactions(
  userId: string,
  userPrefix: string,
  checkingAccountId: number
) {
  const transactions = []
  const start = new Date(2025, 10, 1) // Nov 1, 2025
  const end = new Date(2026, 7, 30)   // Aug 30, 2026
  const daysBetween = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  // Use default categories to pick names/types — codes will be prefixed
  const incomes = defaultCategories.filter(c => c.type === "INCOME")
  const expenses = defaultCategories.filter(c => c.type === "EXPENSE")

  // Derive phantom group codes (same logic as user-init.ts)
  const slotOffset = parseInt(userPrefix.replace(/[^0-9a-f]/gi, "").slice(0, 6) || "0", 16) % 900_000

  for (let i = 0; i < 300; i++) {
    const isIncome = i % 5 === 0 // 1 in 5 is income (60 income, 240 expense)
    const categoryDef = isIncome
      ? incomes[i % incomes.length]
      : expenses[i % expenses.length]

    // Random date within the period
    const randomDayOffset = Math.floor(Math.random() * daysBetween)
    const date = new Date(start.getTime() + randomDayOffset * 24 * 60 * 60 * 1000)

    // Format period YYYYMM
    const periodStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`

    const amount = isIncome
      ? Math.floor(Math.random() * 5000) + 1500
      : Math.floor(Math.random() * 400) + 20

    // Phantom-user-specific codes
    const phantomCategoryCode = `${userPrefix}.${categoryDef.code}`

    // Find the group code for this category
    const originalGroup = defaultGroups.find(g => g.id === categoryDef.groupId)
    const phantomGroupCode = originalGroup
      ? 1_000_000 + slotOffset + originalGroup.code
      : 1_000_000 + slotOffset + 100

    transactions.push({
      id: crypto.randomUUID(),
      period: periodStr,
      date,
      description: `${categoryDef.name}`,
      amount,
      type: categoryDef.type,
      userId,
      accountId: checkingAccountId,
      groupCode: phantomGroupCode,
      categoryCode: phantomCategoryCode,
      statusCode: 1, // 1 = Pago (shared global lookup)
    })
  }

  return transactions
}

export async function GET(request: Request) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Demo mode is disabled" }, { status: 403 })
  }

  try {
    const demoId = crypto.randomUUID()
    // Short prefix: 8 hex chars from the UUID (without hyphens)
    const userPrefix = demoId.replace(/-/g, "").slice(0, 8)
    const userId = `demo_${demoId}`

    // All provisioning in a single Prisma transaction for atomicity and performance
    await prisma.$transaction(async (tx) => {
      // 1. Create phantom user
      await tx.user.create({
        data: {
          id: userId,
          name: "Visitante Demo",
          email: `${userId}@wiseveo.demo`,
          status: "ACTIVE",
          role: "USER",
        },
      })

      // 2. Initialize Chart of Accounts — isolated codes per phantom user
      const accountIds = await initializeUserData(tx, userId, userPrefix)
      const checkingAccountId = accountIds["CHECKING"]

      if (!checkingAccountId) {
        throw new Error("Failed to resolve checking account ID for demo user")
      }

      // 3. Generate and inject 300 transactions (bulk insert)
      const mockTx = generateTransactions(userId, userPrefix, checkingAccountId)
      await tx.transaction.createMany({ data: mockTx })
    }, {
      timeout: 55_000, // 55s (below Vercel's 60s maxDuration)
    })

    // 4. Create session token (outside DB transaction)
    const token = await createSessionToken(userId)

    // 5. Redirect to dashboard with session cookie
    const url = new URL("/dashboard", request.url)
    const response = NextResponse.redirect(url)

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 4, // 4 hours (aligned with cron cleanup window)
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error provisioning demo user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
