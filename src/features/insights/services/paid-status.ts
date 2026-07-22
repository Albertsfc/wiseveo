/**
 * Critério canônico de "pago" da feature de insights.
 *
 * Mesmo conjunto de nomes usado por get-upcoming-transactions.ts: o status é
 * um lookup por usuário, então o match é pelo nome, case-insensitive.
 */
export const PAID_STATUS_NAMES = [
  "PAGO",
  "PAID",
  "PAGA",
  "REALIZADO",
  "QUITADO",
] as const

export function paidStatusFilter() {
  return {
    OR: PAID_STATUS_NAMES.map((name) => ({
      statusLookup: {
        is: { name: { equals: name, mode: "insensitive" as const } },
      },
    })),
  }
}

export function unpaidStatusFilter() {
  return { NOT: paidStatusFilter() }
}
