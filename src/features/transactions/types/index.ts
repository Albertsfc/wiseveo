import { z } from "zod"

export const transactionSchema = z.object({
  id: z.string(),
  num: z.number().nullable(),
  period: z.string(),
  date: z.string(),
  description: z.string().nullable(),
  note: z.string().nullable(),
  reference: z.string().nullable(),
  amount: z.number(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  status: z.enum(["PAID", "PENDING", "OVERDUE", "SCHEDULED"]),
  isExcluded: z.boolean(),
  attachmentCount: z.number().int().nonnegative(),
  messageCount: z.number().int().nonnegative(),
  account: z.object({
    id: z.string(),
    name: z.string(),
  }),
  category: z.object({
    id: z.string(),
    name: z.string(),
    group: z.object({
      id: z.string(),
      name: z.string(),
    }),
  }),
  payee: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
})

export type SerializedTransaction = z.infer<typeof transactionSchema>

export interface TransactionFilterOptions {
  accounts: { id: string; name: string }[]
  categories: { id: string; name: string; groupName: string }[]
  statuses: Array<"PAID" | "PENDING" | "OVERDUE" | "SCHEDULED">
  types: Array<"INCOME" | "EXPENSE" | "TRANSFER">
}

// Form options for the New Transaction dialog
export interface FormAccount {
  id: number // COD_ACC
  name: string
}

export interface FormCategoryGroup {
  id: string
  code: number // COD_GRU
  name: string
  type: "INCOME" | "EXPENSE" | "TRANSFER"
}

export interface FormCategory {
  id: string
  code: string // COD_CAT
  name: string
  type: "INCOME" | "EXPENSE" | "TRANSFER"
  groupId: string
}

export interface FormStatus {
  id: string
  code: number // COD_ST
  name: string
}

export interface FormPayee {
  id: number // COD_BEN
  name: string
}

export interface TransactionFormOptions {
  accounts: FormAccount[]
  groups: FormCategoryGroup[]
  categories: FormCategory[]
  statuses: FormStatus[]
  payees: FormPayee[]
}

export interface TransactionTableMeta {
  onEditTransaction?: (tx: SerializedTransaction) => void
  onCopyTransaction?: (tx: SerializedTransaction) => void
  onDeleteTransaction?: (tx: SerializedTransaction) => void
  onQuickPayTransaction?: (tx: SerializedTransaction) => void
  onMakeRecurring?: (tx: SerializedTransaction) => void
  onOpenAttachments?: (tx: SerializedTransaction) => void
  onOpenNotes?: (tx: SerializedTransaction) => void
}
