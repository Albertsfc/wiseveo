import { PrismaClient } from "../src/generated/prisma_new/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import { initializeUserData } from "../src/lib/user-init"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Start seeding database...");

  const email = "admin@wiseveo.com"
  const password = "admin1234"
  const hashedPassword = await bcrypt.hash(password, 10)

  // 1. Create default admin user
  const adminUser = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
      role: "SUPERADMIN",
      status: "ACTIVE",
    },
    create: {
      name: "Admin WISEVEO",
      email,
      passwordHash: hashedPassword,
      role: "SUPERADMIN",
      status: "ACTIVE",
    },
  });

  console.log(`Default admin user created/updated: ${adminUser.email}`);

  // 2. Initialize default admin user's chart of accounts
  await initializeUserData(prisma, adminUser.id);

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
