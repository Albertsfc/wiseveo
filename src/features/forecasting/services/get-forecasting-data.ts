import { prisma } from "@/lib/prisma"
import { periodFromDate, safeBalance } from "@/lib/financial"
import { startOfMonth, endOfMonth, addMonths, subMonths, format, startOfYear, endOfYear, isBefore } from "date-fns"
import { ptBR } from "date-fns/locale"
import { projectSeries, type ForecastingModel } from "./forecasting-engine"
import type {
  ForecastingData,
  ForecastingColumn,
  ForecastingCell,
  ForecastingSection,
  ForecastingGroup
} from "../types"

interface Bucket {
  groupCode: string
  groupName: string
  categoryCode: string
  categoryName: string
  history: number[]
}

function normalizeName(name: string | null | undefined, fallback: string): string {
  const trimmed = name?.trim()
  if (!trimmed) return fallback
  if (trimmed.toLowerCase() === "outros") return "OUTROS"
  return trimmed
}

export async function getForecastingData(
  userId: string,
  baseDate: Date,
  mode: "CAIXA" | "COMPETENCIA",
  model: ForecastingModel
): Promise<ForecastingData> {
  // --- Referências temporais ---
  const today = new Date()
  const todayY = today.getUTCFullYear()
  const todayM = today.getUTCMonth()
  const currentMonthKey = `${todayY}-${String(todayM + 1).padStart(2, "0")}`

  const baseY = baseDate.getUTCFullYear()
  const baseM = baseDate.getUTCMonth()
  const baseMonthKey = `${baseY}-${String(baseM + 1).padStart(2, "0")}`

  // Histórico desde Janeiro do ano anterior (~12-24 meses de base sólida)
  const historyStart = new Date(Date.UTC(baseY - 1, 0, 1, 0, 0, 0, 0))
  // Para cobrir até o mês corrente (inclusive), o final da base histórica é o fim do mês corrente em UTC
  const historyEndDate = new Date(Date.UTC(todayY, todayM + 1, 0, 23, 59, 59, 999))

  const historyKeys: string[] = []
  let curY = historyStart.getUTCFullYear()
  let curM = historyStart.getUTCMonth()
  
  while (curY < todayY || (curY === todayY && curM <= todayM)) {
    historyKeys.push(`${curY}-${String(curM + 1).padStart(2, "0")}`)
    curM++
    if (curM > 11) {
      curM = 0
      curY++
    }
  }

  const baseMonthIndex = historyKeys.indexOf(baseMonthKey)
  const currentMonthIndex = historyKeys.indexOf(currentMonthKey)

  // --- Colunas visíveis: do mês-base até Dezembro do ano do mês-base ---
  const columns: ForecastingColumn[] = []
  const monthsPT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
  
  curY = baseY
  curM = baseM
  while (curM <= 11) {
    const mk = `${curY}-${String(curM + 1).padStart(2, "0")}`
    columns.push({
      monthKey: mk,
      label: `${monthsPT[curM]}-${String(curY).slice(-2)}`.toUpperCase(),
      isProjected: mk >= currentMonthKey
    })
    curM++
  }

  // Quantos meses futuros projetar (após o mês corrente)
  const currentMonthColIndex = columns.findIndex(c => c.monthKey === currentMonthKey)
  const futureMonthsCount = currentMonthColIndex !== -1
    ? Math.max(0, columns.length - currentMonthColIndex - 1)
    : columns.length

  // --- Fetch de transações ---
  // CAIXA: dois fetches separados
  //   1. Histórico fechado: somente Pago, até fim do último mês fechado
  //   2. Mês vigente (limiar): todos os lançamentos, independente de status
  // COMPETÊNCIA: único fetch até o mês corrente (sem filtro de status)
  const txSelect = {
    amount: true,
    type: true,
    date: true,
    period: true,
    groupCode: true,
    categoryCode: true,
    group: { select: { code: true, name: true } },
    category: { select: { code: true, name: true } }
  } as const

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let transactions: any[] = []

  if (mode === "CAIXA") {
    transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: historyStart, lte: historyEndDate },
        type: { in: ["INCOME", "EXPENSE", "TRANSFER"] }
      },
      select: txSelect
    })
  } else {
    // COMPETÊNCIA: período até o mês corrente, sem filtro de status
    transactions = await prisma.transaction.findMany({
      where: {
        userId,
        period: {
          gte: periodFromDate(historyStart),
          lte: periodFromDate(historyEndDate)
        },
        type: { in: ["INCOME", "EXPENSE", "TRANSFER"] }
      },
      select: txSelect
    })
  }

  // --- Buckets ---
  const incomeMap = new Map<string, Bucket>()
  const expenseMap = new Map<string, Bucket>()

  function getBucket(
    targetMap: Map<string, Bucket>,
    groupCode: string, groupName: string,
    categoryCode: string, categoryName: string
  ) {
    const key = `${groupCode}:${categoryCode}`
    if (!targetMap.has(key)) {
      targetMap.set(key, {
        groupCode, groupName, categoryCode, categoryName,
        history: Array(historyKeys.length).fill(0)
      })
    }
    return targetMap.get(key)!
  }

  for (const tx of transactions) {
    if (Number(tx.amount ?? 0) === 0) continue

    const txDate = tx.date ?? new Date()
    const txKey = mode === "CAIXA"
      ? `${txDate.getUTCFullYear()}-${String(txDate.getUTCMonth() + 1).padStart(2, "0")}`
      : `${tx.period?.slice(0, 4)}-${tx.period?.slice(4, 6)}`

    const keyIndex = historyKeys.indexOf(txKey)
    if (keyIndex === -1) continue

    const groupCode = String(tx.group?.code ?? tx.groupCode ?? 0)
    const categoryCode = String(tx.category?.code ?? tx.categoryCode ?? 0)

    const amountRaw = Number(tx.amount ?? 0)
    const isIncome = tx.type === "INCOME" || (tx.type === "TRANSFER" && amountRaw >= 0)
    const targetMap = isIncome ? incomeMap : expenseMap
    // Entradas (Incomes) devem refletir seu valor bruto para que receitas negativas (estornos) subtraiam do saldo
    // Saídas (Expenses) usam Math.abs para somar positivamente no grupo de despesas
    const amount = isIncome ? amountRaw : Math.abs(amountRaw)
    
    const defaultGroupName = isIncome ? "Entradas diversas" : "Saídas diversas"
    const gName = normalizeName(tx.group?.name, defaultGroupName)
    const cName = normalizeName(tx.category?.name, "Geral")
    
    getBucket(targetMap, groupCode, gName, categoryCode, cName).history[keyIndex] += amount
  }

  // --- buildSection com lógica REAL / LIMIAR / PROJ por coluna ---
  function buildSection(name: string, map: Map<string, Bucket>, referenceTotals?: number[]): ForecastingSection {
    const groupDict = new Map<string, ForecastingGroup>()

    for (const bucket of map.values()) {
      if (!groupDict.has(bucket.groupCode)) {
        groupDict.set(bucket.groupCode, {
          code: bucket.groupCode,
          name: bucket.groupName,
          categories: [],
          cells: Array(columns.length).fill(null).map(() => ({
            amount: 0, isProjected: false, ahPercentage: 0, avPercentage: 0
          }))
        })
      }

      const group = groupDict.get(bucket.groupCode)!
      const isTransfer = group.name === "Caixa e Captação"

      // Base para projeção: histórico até o mês corrente (inclusive)
      const historyForProjection = currentMonthIndex !== -1
        ? bucket.history.slice(0, currentMonthIndex + 1)
        : bucket.history.slice(0, baseMonthIndex + 1)

      const projected = projectSeries(historyForProjection, futureMonthsCount, model, !isTransfer)

      const categoryCells: ForecastingCell[] = []

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i]
        const mk = col.monthKey
        const histIdx = historyKeys.indexOf(mk)

        let amount: number
        if (mk < currentMonthKey) {
          // REAL: mês totalmente fechado — usa dado histórico real
          amount = histIdx !== -1 ? (bucket.history[histIdx] || 0) : 0
        } else if (mk === currentMonthKey) {
          // LIMIAR: mês vigente — todos os lançamentos já processados no bucket
          amount = histIdx !== -1 ? (bucket.history[histIdx] || 0) : 0
        } else {
          // PROJ: mês futuro — motor de projeção
          const futureIdx = i - (currentMonthColIndex !== -1 ? currentMonthColIndex + 1 : columns.length)
          amount = projected[Math.max(0, futureIdx)] || 0
        }

        const prevAmt = i === 0
          ? (baseMonthIndex > 0 ? (bucket.history[baseMonthIndex - 1] || 0) : 0)
          : categoryCells[i - 1].amount

        categoryCells.push({
          amount,
          isProjected: col.isProjected,
          avPercentage: 0,
          ahPercentage: prevAmt > 0 ? ((amount / prevAmt) - 1) * 100 : 0
        })
      }

      group.categories.push({
        code: bucket.categoryCode,
        name: bucket.categoryName,
        cells: categoryCells
      })
    }

    const groups = Array.from(groupDict.values()).sort((a, b) => a.name.localeCompare(b.name))

    for (const group of groups) {
      for (let i = 0; i < columns.length; i++) {
        const sum = group.categories.reduce((acc, cat) => acc + cat.cells[i].amount, 0)
        group.cells[i].amount = sum
        group.cells[i].isProjected = columns[i].isProjected

        if (i === 0) {
          const prevTotal = Array.from(map.values())
            .filter(b => b.groupCode === group.code)
            .reduce((acc, b) => acc + (b.history[baseMonthIndex - 1] || 0), 0)
          group.cells[i].ahPercentage = prevTotal > 0 ? ((sum / prevTotal) - 1) * 100 : 0
        } else {
          const prevTotal = group.cells[i - 1].amount
          group.cells[i].ahPercentage = prevTotal > 0 ? ((sum / prevTotal) - 1) * 100 : 0
        }
      }
    }

    const sectionCells: ForecastingCell[] = Array(columns.length).fill(null).map((_, i) => ({
      amount: groups.reduce((acc, g) => acc + g.cells[i].amount, 0),
      isProjected: columns[i].isProjected,
      ahPercentage: 0,
      avPercentage: 0 // Will be calculated below
    }))

    for (let i = 0; i < columns.length; i++) {
      const prevTotal = i === 0
        ? Array.from(map.values()).reduce((acc, b) => acc + (b.history[baseMonthIndex - 1] || 0), 0)
        : sectionCells[i - 1].amount
      sectionCells[i].ahPercentage = prevTotal > 0 ? ((sectionCells[i].amount / prevTotal) - 1) * 100 : 0
    }

    for (let i = 0; i < columns.length; i++) {
      const sectionTotal = sectionCells[i].amount
      const avBase = referenceTotals ? referenceTotals[i] : sectionTotal
      
      sectionCells[i].avPercentage = avBase > 0 ? (sectionTotal / avBase) * 100 : 0

      for (const group of groups) {
        group.cells[i].avPercentage = avBase > 0 ? (group.cells[i].amount / avBase) * 100 : 0
        for (const cat of group.categories) {
          cat.cells[i].avPercentage = avBase > 0 ? (cat.cells[i].amount / avBase) * 100 : 0
        }
      }
    }

    return { name, groups, cells: sectionCells }
  }

  const income = buildSection("Entradas", incomeMap)
  const incomeTotals = income.cells.map(c => c.amount)
  const expense = buildSection("Saídas", expenseMap, incomeTotals)

  // --- SALDO FINAL ---
  const netResultCells: ForecastingCell[] = Array(columns.length).fill(null).map((_, i) => {
    const amount = income.cells[i].amount - expense.cells[i].amount
    const avBase = income.cells[i].amount
    return { 
      amount, 
      isProjected: columns[i].isProjected, 
      ahPercentage: 0, 
      avPercentage: avBase > 0 ? (amount / avBase) * 100 : 0 
    }
  })

  for (let i = 0; i < columns.length; i++) {
    const prevTotal = i === 0
      ? (() => {
          const prevInc = Array.from(incomeMap.values()).reduce((acc, b) => acc + (b.history[baseMonthIndex - 1] || 0), 0)
          const prevExp = Array.from(expenseMap.values()).reduce((acc, b) => acc + (b.history[baseMonthIndex - 1] || 0), 0)
          return prevInc - prevExp
        })()
      : netResultCells[i - 1].amount
    netResultCells[i].ahPercentage = prevTotal !== 0 ? ((netResultCells[i].amount / prevTotal) - 1) * 100 : 0
  }

  // --- SALDO ACUMULADO ---
  // Marco zero: saldo real das contas + lançamentos anteriores ao mês-base
  const [accounts, txBeforeAgg] = await Promise.all([
    prisma.account.findMany({
      where: { userId, active: true },
      select: { balance: true },
    }),
    mode === "CAIXA"
      ? prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            userId,
            date: { lt: new Date(Date.UTC(baseY, baseM, 1, 0, 0, 0, 0)) },
          },
        })
      : prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            userId,
            period: { lt: `${baseY}${String(baseM + 1).padStart(2, "0")}` },
          },
        })
  ])

  const initialSum = accounts.reduce((sum, acc) => sum + safeBalance(acc.balance), 0)
  let initialBalance = initialSum + Number(txBeforeAgg._sum.amount ?? 0)

  let runningTotal = initialBalance
  const accumulatedCells: ForecastingCell[] = netResultCells.map((cell) => {
    const prev = runningTotal
    runningTotal += cell.amount
    return {
      amount: runningTotal,
      isProjected: cell.isProjected,
      ahPercentage: prev !== 0 ? ((runningTotal / prev) - 1) * 100 : 0,
      avPercentage: 0
    }
  })

  return { columns, income, expense, netResultCells, accumulatedCells }
}
