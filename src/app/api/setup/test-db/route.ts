import { NextResponse } from "next/server"
import { Client } from "pg"

export async function POST(req: Request) {
  try {
    const { connectionString } = await req.json()

    if (!connectionString) {
      return NextResponse.json(
        { success: false, message: "Connection string is required." },
        { status: 400 }
      )
    }

    // Use native pg client to avoid instantiating Prisma with a bad URL
    const client = new Client({ connectionString })
    
    try {
      await client.connect()
    } catch (e: any) {
      return NextResponse.json({
        success: false,
        message: `Falha ao conectar: ${e.message}`,
      })
    }

    let hasData = false
    let audit = null

    // Check if the db already has WiseVeo tables and data
    try {
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'transactions'
        );
      `)

      if (tableCheck.rows[0].exists) {
        hasData = true
        
        // Fetch actual existing data for the chart of accounts
        const [accountsRes, transactionsRes, categoriesRes, groupsRes] = await Promise.all([
          client.query('SELECT "COD_ACC" as id, "CONTA" as name, "TIPO" as type FROM accounts'),
          client.query('SELECT COUNT(*) FROM transactions'),
          client.query('SELECT id, "COD_CAT" as code, "CATEGORIA" as name, "TIPO" as type, group_id FROM categories'),
          client.query('SELECT id, "COD_GRU" as code, "GRUPO" as name, type FROM category_groups'),
        ])

        const dbGroups = groupsRes.rows.map((g: any) => ({
          id: g.id,
          code: g.code,
          name: g.name,
          type: g.type,
          categories: categoriesRes.rows
            .filter((c: any) => c.group_id === g.id)
            .map((c: any) => ({
              id: c.id,
              code: c.code,
              name: c.name,
              type: c.type,
            }))
        }))

        const dbAccounts = accountsRes.rows.map((a: any) => ({
          id: a.id,
          name: a.name,
          type: a.type
        }))

        audit = {
          accounts: accountsRes.rows.length,
          transactions: parseInt(transactionsRes.rows[0].count, 10),
          categories: categoriesRes.rows.length,
          groups: groupsRes.rows.length,
          existingChart: {
            groups: dbGroups,
            accounts: dbAccounts,
          }
        }
      }
    } catch (e) {
      // Tables might not exist, which is fine (fresh DB)
    } finally {
      await client.end()
    }

    return NextResponse.json({
      success: true,
      hasData,
      audit,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Unknown error occurred" },
      { status: 500 }
    )
  }
}
