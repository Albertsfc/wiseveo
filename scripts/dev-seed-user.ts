/**
 * DEV-ONLY seed — cria (uma vez) um usuário de testes local dedicado, isolado
 * como os usuários demo (códigos com prefixo próprio), já com plano de contas e
 * transações para o dashboard não vir vazio.
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/dev-seed-user.ts [email]
 *
 * Depois, aponte DEV_SESSION_EMAIL para esse e-mail no .env.local e acesse
 * /api/dev/session. Idempotente: se o usuário já existir, não faz nada.
 *
 * NUNCA use em produção: cria um usuário ACTIVE sem senha.
 */
import crypto from "crypto"
import { prisma } from "../src/lib/prisma"
import { initializeUserData } from "../src/lib/user-init"
import {
  defaultCategories,
  defaultGroups,
} from "../prisma/data/default-chart-of-accounts"

const DEFAULT_EMAIL = "dev@wiseveo.local"

function buildTransactions(userId: string, prefix: string, checkingAccountId: number) {
  const start = new Date(2025, 10, 1) // Nov 1, 2025
  const end = new Date(2026, 7, 30) // Aug 30, 2026
  const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000)
  const incomes = defaultCategories.filter((c) => c.type === "INCOME")
  const expenses = defaultCategories.filter((c) => c.type === "EXPENSE")
  const slotOffset = parseInt(prefix.replace(/[^0-9a-f]/gi, "").slice(0, 6) || "0", 16) % 900_000

  const rows = []
  for (let i = 0; i < 200; i++) {
    const isIncome = i % 5 === 0
    const def = isIncome ? incomes[i % incomes.length] : expenses[i % expenses.length]
    const date = new Date(start.getTime() + Math.floor(Math.random() * days) * 86_400_000)
    const period = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`
    const group = defaultGroups.find((g) => g.id === def.groupId)
    rows.push({
      id: crypto.randomUUID(),
      period,
      date,
      description: def.name,
      amount: isIncome
        ? Math.floor(Math.random() * 5000) + 1500
        : Math.floor(Math.random() * 400) + 20,
      type: def.type,
      userId,
      accountId: checkingAccountId,
      groupCode: group ? 1_000_000 + slotOffset + group.code : 1_000_000 + slotOffset + 100,
      categoryCode: `${prefix}.${def.code}`,
      statusCode: 1,
    })
  }
  return rows
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run dev seed with NODE_ENV=production")
  }

  const email = (process.argv[2] || DEFAULT_EMAIL).trim().toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`✓ Usuário de dev já existe: ${email} (id=${existing.id}, status=${existing.status})`)
    console.log(`  Aponte DEV_SESSION_EMAIL="${email}" no .env.local e acesse /api/dev/session.`)
    return
  }

  const uuid = crypto.randomUUID()
  const prefix = uuid.replace(/-/g, "").slice(0, 8)
  const userId = `dev_${uuid}`

  await prisma.$transaction(
    async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          name: "Dev Local",
          email,
          status: "ACTIVE",
          role: "USER",
        },
      })
      const accountIds = await initializeUserData(tx, userId, prefix)
      const checking = accountIds["CHECKING"]
      if (!checking) throw new Error("checking account not created")
      await tx.transaction.createMany({ data: buildTransactions(userId, prefix, checking) })
    },
    { timeout: 55_000 }
  )

  console.log(`✓ Usuário de dev criado: ${email} (id=${userId})`)
  console.log(`  DEV_SESSION_EMAIL="${email}" já pode ser usado em /api/dev/session.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => process.exit())
