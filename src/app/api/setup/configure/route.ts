import { NextResponse } from "next/server"
import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@/generated/prisma_new/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { initializeUserData } from "@/lib/user-init"

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const { databaseUrl, useExistingData, admin, locale, integrations } = payload

    if (!databaseUrl || !admin?.email || !admin?.password) {
      return NextResponse.json({ success: false, message: "Campos obrigatórios ausentes." }, { status: 400 })
    }

    // 1. Run migrations via CLI
    try {
      console.log("[SETUP] Executando migrações do banco de dados...")
      execSync("npx prisma migrate deploy", {
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: "pipe",
      })
    } catch (e: any) {
      console.error("[SETUP] Erro na migração:", e.stdout?.toString(), e.stderr?.toString())
      return NextResponse.json({ success: false, message: "Erro ao migrar banco de dados." }, { status: 500 })
    }

    // 2. Insert admin user and initialize data using a scoped Prisma Client
    console.log("[SETUP] Conectando ao banco para criar usuário admin...")
    const pool = new Pool({ connectionString: databaseUrl })
    const adapter = new PrismaPg(pool)
    const client = new PrismaClient({ adapter })

    try {
      const hashedPassword = await bcrypt.hash(admin.password, 10)
      const userId = crypto.randomUUID()

      // Criar o usuário superadmin
      await client.user.create({
        data: {
          id: userId,
          name: admin.name,
          email: admin.email,
          passwordHash: hashedPassword,
          role: "SUPERADMIN",
          status: "ACTIVE",
        },
      })

      // Inicializar plano de contas se não for banco existente
      if (!useExistingData) {
        console.log("[SETUP] Inicializando plano de contas padrão...")
        await initializeUserData(client, userId)
      }
    } catch (e: any) {
      console.error("[SETUP] Erro ao criar usuário/dados:", e)
      return NextResponse.json({ success: false, message: `Erro ao criar usuário admin: ${e.message}` }, { status: 500 })
    } finally {
      await client.$disconnect()
      await pool.end()
    }

    // 3. Prepare ENV content
    console.log("[SETUP] Gerando .env.local...")
    const authSecret = crypto.randomBytes(32).toString("base64")
    
    let envContent = `\n# --- Gerado automaticamente pelo Setup Wizard ---\n`
    envContent += `WISEVEO_SETUP_COMPLETE="true"\n`
    envContent += `DATABASE_URL="${databaseUrl}"\n`
    envContent += `AUTH_SECRET="${authSecret}"\n`
    
    if (integrations?.google?.enabled) {
      envContent += `GOOGLE_CLIENT_ID="${integrations.google.clientId}"\n`
      envContent += `GOOGLE_CLIENT_SECRET="${integrations.google.clientSecret}"\n`
    }
    
    if (integrations?.telegram?.enabled) {
      envContent += `TELEGRAM_BOT_TOKEN="${integrations.telegram.botToken}"\n`
      envContent += `TELEGRAM_BOT_USERNAME="${integrations.telegram.botUsername}"\n`
      envContent += `TELEGRAM_WEBHOOK_SECRET="${integrations.telegram.webhookSecret}"\n`
    }

    if (integrations?.openai?.enabled) {
      envContent += `OPENAI_API_KEY="${integrations.openai.apiKey}"\n`
    }

    // Write to .env.local
    const envPath = path.resolve(process.cwd(), ".env.local")
    
    // Check if file exists to append or create new
    if (fs.existsSync(envPath)) {
      fs.appendFileSync(envPath, envContent)
    } else {
      fs.writeFileSync(envPath, envContent)
    }

    console.log("[SETUP] Setup concluído com sucesso!")
    
    // Set a cookie so the login page knows to redirect to settings onboarding
    const response = NextResponse.json({ success: true })
    response.cookies.set("wiseveo-new-setup", "true", {
      path: "/",
      maxAge: 60 * 60, // 1 hour
    })
    
    return response
  } catch (error: any) {
    console.error("[SETUP] Fatal error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Unknown error occurred" },
      { status: 500 }
    )
  }
}
