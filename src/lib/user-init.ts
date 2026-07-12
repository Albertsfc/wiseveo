import {
  defaultGroups,
  defaultCategories,
  defaultStatuses,
  defaultAccounts,
} from "../../prisma/data/default-chart-of-accounts"
import crypto from "crypto"

/** Map of account type → created account ID, returned after initialization. */
export type InitializedAccounts = Record<string, number>

/**
 * Initializes default chart of accounts and statuses for a new user.
 *
 * Accepts a Prisma client or transaction to allow dependency injection.
 *
 * @param tx         - Prisma client or transaction object
 * @param userId     - The user's ID
 * @param userPrefix - Optional short prefix for phantom/demo users (e.g. first 8 chars of demoId).
 *                     When provided, all codes (CategoryGroup.code, Category.code) are offset/prefixed
 *                     so each demo user gets completely isolated records — never conflicting with real
 *                     user data or with other demo users.
 *                     Real users should omit this parameter (uses upsert with shared default codes).
 *
 * @returns Object with the account IDs created, keyed by account type (CHECKING, SAVINGS, WALLET).
 */
export async function initializeUserData(
  tx: any,
  userId: string,
  userPrefix?: string
): Promise<InitializedAccounts> {
  console.log(
    `[initializeUserData] Initializing for user: ${userId} (prefix: ${userPrefix ?? "none"})`
  )

  const accountIds: InitializedAccounts = {}

  if (userPrefix) {
    // ─────────────────────────────────────────────────────────────────────────
    // PHANTOM / DEMO user: create isolated records with derived unique codes.
    //
    // Strategy:
    //   - CategoryGroup.code (Int @unique): use a large offset derived from
    //     the prefix so each phantom user occupies a different numeric range.
    //     Real user codes: 100–900. Phantom codes: 1_000_000 + slotOffset * 10 + originalCode
    //   - Category.code (String @unique): prepend the prefix string.
    //     Real: "100.001". Phantom: "d1a2b3c4.100.001"
    //   - TransactionStatusLookup.code (Int @unique): status codes (1-4) are
    //     global lookup values shared by FK in transactions. We reuse the same
    //     shared records — phantom users do NOT need their own copy of statuses.
    //     The `userId` on the status row is just a reference owner, not isolation.
    //   - Account.id (Int @id, no autoincrement): generate a high unique Int from timestamp + random.
    // ─────────────────────────────────────────────────────────────────────────

    // Derive a numeric slot from the prefix (hex → decimal, capped to avoid overflow)
    const slotOffset = parseInt(userPrefix.replace(/[^0-9a-f]/gi, "").slice(0, 6) || "0", 16) % 900_000

    // 1. Ensure shared Transaction Statuses exist (upsert — shared global lookup)
    for (const status of defaultStatuses) {
      await tx.transactionStatusLookup.upsert({
        where: { code: status.code },
        update: {}, // keep existing, don't change userId to phantom user
        create: {
          id: status.id || crypto.randomUUID(),
          code: status.code,
          name: status.name,
          userId, // owner of this row (will be updated to real user on first real signup)
        },
      })
    }

    // 2. Category Groups — unique codes per phantom user
    const groupCodeMap: Record<number, number> = {} // originalCode → phantomCode
    for (const group of defaultGroups) {
      const phantomCode = 1_000_000 + slotOffset + group.code
      groupCodeMap[group.code] = phantomCode

      await tx.categoryGroup.create({
        data: {
          id: crypto.randomUUID(),
          code: phantomCode,
          name: group.name,
          type: group.type,
          userId,
        },
      })
    }

    // 3. Categories — unique string codes per phantom user
    //    Resolve groupId (UUID) using the groupCodeMap built in step 2.
    //    defaultCategories reference groupId as the original `id` string (e.g. "grp-income-100").
    //    We need to map that to the newly created phantom CategoryGroup UUID.
    //    Build: originalGroupId (e.g. "grp-income-100") → phantom CategoryGroup UUID
    const createdGroups: Array<{ id: string; code: number }> = await tx.categoryGroup.findMany({
      where: { userId },
      select: { id: true, code: true },
    })
    // Reverse map: phantomGroupCode (Int) → phantom group UUID
    const phantomCodeToGroupUuid: Record<number, string> = {}
    for (const g of createdGroups) {
      phantomCodeToGroupUuid[g.code] = g.id
    }
    // Map: original defaultGroup.id string → phantom group UUID
    const originalGroupIdToPhantomUuid: Record<string, string> = {}
    for (const group of defaultGroups) {
      const phantomCode = groupCodeMap[group.code]
      if (phantomCode && phantomCodeToGroupUuid[phantomCode]) {
        originalGroupIdToPhantomUuid[group.id] = phantomCodeToGroupUuid[phantomCode]
      }
    }

    for (const category of defaultCategories) {
      const groupUuid = originalGroupIdToPhantomUuid[category.groupId]

      await tx.category.create({
        data: {
          id: crypto.randomUUID(),
          code: `${userPrefix}.${category.code}`,
          name: category.name,
          type: category.type,
          groupId: groupUuid,
          userId,
        },
      })
    }

    // 4. Accounts — generate high unique Int IDs
    const baseAccountId = 1_000_000 + slotOffset
    let accountOffset = 0
    for (const account of defaultAccounts) {
      const phantomAccountId = baseAccountId + accountOffset
      await tx.account.create({
        data: {
          id: phantomAccountId,
          name: account.name,
          type: account.type,
          balance: account.balance,
          legacyDate: new Date(),
          userId,
        },
      })
      accountIds[account.type] = phantomAccountId
      accountOffset++
    }
  } else {
    // ─────────────────────────────────────────────────────────────────────────
    // REAL user: upsert shared default codes (original behavior preserved).
    // ─────────────────────────────────────────────────────────────────────────

    // 1. Transaction Statuses
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
      })
    }

    // 2. Category Groups
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
      })
    }

    // 3. Categories
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
      })
    }

    // 4. Accounts
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
      })
      accountIds[account.type] = account.id
    }
  }

  console.log(`[initializeUserData] Done for user: ${userId}`)
  return accountIds
}
