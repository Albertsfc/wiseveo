import { defaultGroups, defaultCategories, defaultStatuses, defaultAccounts } from "../../prisma/data/default-chart-of-accounts"
import crypto from "crypto"

/**
 * Initializes default chart of accounts and statuses for a new user.
 * Accepts a Prisma client or transaction to allow dependency injection.
 */
export async function initializeUserData(tx: any, userId: string) {
  console.log(`[initializeUserData] Initializing user data for user: ${userId}`);

  // 1. Create Transaction Statuses
  for (const status of defaultStatuses) {
    await tx.transactionStatusLookup.upsert({
      where: { code: status.code },
      update: { userId },
      create: {
        id: status.id || crypto.randomUUID(),
        code: status.code,
        name: status.name,
        userId,
      },
    });
  }

  // 2. Create Category Groups
  for (const group of defaultGroups) {
    await tx.categoryGroup.upsert({
      where: { code: group.code },
      update: { userId, name: group.name, type: group.type },
      create: {
        id: group.id || crypto.randomUUID(),
        code: group.code,
        name: group.name,
        type: group.type,
        userId,
      },
    });
  }

  // 3. Create Categories
  for (const category of defaultCategories) {
    await tx.category.upsert({
      where: { code: category.code },
      update: { userId, name: category.name, type: category.type, groupId: category.groupId },
      create: {
        id: category.id || crypto.randomUUID(),
        code: category.code,
        name: category.name,
        type: category.type,
        groupId: category.groupId,
        userId,
      },
    });
  }

  // 4. Create Accounts
  for (const account of defaultAccounts) {
    await tx.account.upsert({
      where: { id: account.id },
      update: { userId, name: account.name, type: account.type },
      create: {
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.balance,
        legacyDate: new Date(),
        userId,
      },
    });
  }

  console.log(`[initializeUserData] Successfully initialized user data for user: ${userId}`);
}
