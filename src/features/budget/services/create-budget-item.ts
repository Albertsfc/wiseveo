"use server"

import { prisma } from "@/lib/prisma"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { randomUUID } from "crypto"

interface CreateBudgetInput {
  groupId: string
  categoryId?: string
  customName?: string
  amount: number
}

/**
 * Create a new Budget record for a group or individual category.
 * Uses the current month/year.
 */
export async function createBudgetItem(input: CreateBudgetInput) {
  const userId = await getDefaultUserId()
  if (!userId) throw new Error("User not found") // i18n-ignore: código de erro interno do service layer (rota traduz, service retorna código estável)

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const customName = input.customName?.trim() || null

  if (input.categoryId) {
    // Category-level budget
    await prisma.budget.create({
      data: {
        id: randomUUID(),
        amount: input.amount,
        month,
        year,
        spent: -1, // Marker flag for isolated category budgets
        categoryId: input.categoryId,
        groupId: input.groupId,
        userId,
        customName,
      },
    })
  } else {
    // Group-level budget
    await prisma.budget.create({
      data: {
        id: randomUUID(),
        amount: input.amount,
        month,
        year,
        groupId: input.groupId,
        userId,
        customName,
      },
    })
  }
}
