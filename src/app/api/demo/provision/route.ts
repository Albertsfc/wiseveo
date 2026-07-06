import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { initializeUserData } from "@/lib/user-init"
import { createSessionToken, COOKIE_NAME } from "@/lib/auth"
import { defaultCategories } from "../../../../../prisma/data/default-chart-of-accounts"

export const dynamic = 'force-dynamic'

function generateTransactions(userId: string) {
  const transactions = []
  const start = new Date(2025, 10, 1) // Nov 1, 2025
  const end = new Date(2026, 7, 30)   // Aug 30, 2026

  const daysBetween = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
  const incomes = defaultCategories.filter(c => c.type === "INCOME")
  const expenses = defaultCategories.filter(c => c.type === "EXPENSE" && c.type !== "TRANSFER")

  // Generate 300 transactions spread across the period
  for (let i = 0; i < 300; i++) {
    const isIncome = i % 5 === 0 // 1 in 5 is income
    const category = isIncome 
      ? incomes[Math.floor(Math.random() * incomes.length)] 
      : expenses[Math.floor(Math.random() * expenses.length)]
    
    // Random date within the period
    const randomDayOffset = Math.floor(Math.random() * daysBetween)
    const date = new Date(start.getTime() + randomDayOffset * 24 * 60 * 60 * 1000)
    
    // Format period YYYYMM
    const periodStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`

    const amount = isIncome 
      ? Math.floor(Math.random() * 5000) + 1500 
      : Math.floor(Math.random() * 400) + 20

    transactions.push({
      id: crypto.randomUUID(),
      period: periodStr,
      date,
      description: `Mock ${category.name}`,
      amount,
      type: category.type,
      userId,
      accountId: 1, // Checking account (created by initializeUserData)
      groupCode: parseInt(category.groupId.split('-').pop() || "0"),
      categoryCode: category.code,
      statusCode: 1, // Paid
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
    const userId = `demo_${demoId}`

    // 1. Create phantom user
    await prisma.user.create({
      data: {
        id: userId,
        name: "Visitante Demo",
        email: `${userId}@wiseveo.demo`,
        status: "ACTIVE",
        role: "USER"
      }
    })

    // 2. Initialize Chart of Accounts (Categories, Groups, Accounts, Statuses)
    await initializeUserData(prisma, userId)

    // 3. Generate 300 transactions
    const mockTx = generateTransactions(userId)
    
    // 4. Inject transactions
    await prisma.transaction.createMany({
      data: mockTx
    })

    // 5. Create session token
    const token = await createSessionToken(userId)

    // 6. Redirect to dashboard with session cookie
    const url = new URL("/dashboard", request.url)
    const response = NextResponse.redirect(url)
    
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error provisioning demo user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
