"use server"

import { prisma } from "@/lib/prisma"
import { getSessionUserId } from "@/lib/session"
import { revalidatePath } from "next/cache"

/**
 * Updates the budget cards order in the user's preferencesJson.
 * @param itemIds Array of item IDs in the new order.
 */
export async function updateBudgetOrder(itemIds: string[]) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    // Get current preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferencesJson: true },
    })

    const preferences = (user?.preferencesJson as any) || {}
    
    // Update only the budgetOrder key
    const updatedPreferences = {
      ...preferences,
      budgetOrder: itemIds,
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        preferencesJson: updatedPreferences,
      },
    })

    revalidatePath("/budget")
    return { success: true }
  } catch (error) {
    console.error("Failed to update budget order:", error)
    return { success: false, error: "Internal Server Error" }
  }
}
