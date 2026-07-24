import { PrismaClient } from "../src/generated/prisma_new/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import { initializeUserData } from "../src/lib/user-init"
import { generateMockData } from "./data/mock-data"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Start seeding demo database...");

  const email = process.env.SEED_DEMO_EMAIL?.trim().toLowerCase() || "demo@wiseveo.com"
  const password = process.env.SEED_DEMO_PASSWORD
  if (!password) {
    throw new Error(
      "SEED_DEMO_PASSWORD is required. Set it in your environment before seeding."
    )
  }
  const hashedPassword = await bcrypt.hash(password, 10)

  // 1. Create/Update demo user
  const demoUser = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
      role: "USER",
      status: "ACTIVE",
    },
    create: {
      name: "Demo WISEVEO",
      email,
      passwordHash: hashedPassword,
      role: "USER",
      status: "ACTIVE",
    },
  });

  console.log(`Demo user created/updated: ${demoUser.email}`);

  // 2. Initialize default chart of accounts
  await initializeUserData(prisma, demoUser.id);

  // 3. Clear existing user transactions, budgets, payees, and recurring transactions to prevent duplicate keys
  console.log("Cleaning up old demo data...");
  await prisma.transaction.deleteMany({ where: { userId: demoUser.id } });
  await prisma.recurringTransaction.deleteMany({ where: { userId: demoUser.id } });
  await prisma.budget.deleteMany({ where: { userId: demoUser.id } });
  await prisma.payee.deleteMany({ where: { userId: demoUser.id } });

  // 4. Generate mock data
  const { payees, transactions, budgets, recurring } = generateMockData(demoUser.id);

  // 5. Insert Payees
  console.log("Inserting demo payees...");
  for (const payee of payees) {
    await prisma.payee.create({
      data: {
        id: payee.id,
        name: payee.name,
        userId: demoUser.id,
      },
    });
  }

  // 6. Insert Transactions
  console.log("Inserting demo transactions...");
  for (const tx of transactions) {
    await prisma.transaction.create({
      data: {
        id: tx.id,
        num: tx.num,
        period: tx.period,
        date: tx.date,
        reference: tx.reference,
        note: tx.note,
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        userId: tx.userId,
        accountId: tx.accountId,
        destAccountId: tx.destAccountId,
        groupCode: tx.groupCode,
        categoryCode: tx.categoryCode,
        statusCode: tx.statusCode,
        payeeId: tx.payeeId,
      },
    });
  }

  // 7. Insert Budgets
  console.log("Inserting demo budgets...");
  for (const bgt of budgets) {
    await prisma.budget.create({
      data: {
        id: bgt.id,
        amount: bgt.amount,
        month: bgt.month,
        year: bgt.year,
        groupId: bgt.groupId,
        spent: bgt.spent,
        userId: bgt.userId,
      },
    });
  }

  // 8. Insert Recurring Transactions
  console.log("Inserting demo recurring transactions...");
  for (const rec of recurring) {
    await prisma.recurringTransaction.create({
      data: {
        id: rec.id,
        period: rec.period,
        note: rec.note,
        description: rec.description,
        amount: rec.amount,
        type: rec.type,
        userId: rec.userId,
        accountId: rec.accountId,
        groupCode: rec.groupCode,
        categoryCode: rec.categoryCode,
        statusCode: rec.statusCode,
        reference: rec.reference,
      },
    });
  }

  console.log("Demo database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during demo database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
