import { Landmark } from "lucide-react"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { getAccountsWithBalance } from "@/features/accounts/services/get-accounts"
import { AccountsClient } from "@/features/accounts/components/accounts-client"

export default async function BanksPage() {
  const userId = await getDefaultUserId()

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-96 px-4 lg:px-6">
        <p className="text-muted-foreground">Usuário não encontrado.</p>
      </div>
    )
  }

  const accounts = await getAccountsWithBalance(userId)

  return (
    <>

      {/* Account Cards */}
      <div className="px-4 lg:px-6">
        <AccountsClient initialAccounts={accounts} />
      </div>

      {/* Coming Soon Section */}
      <div className="px-4 lg:px-6">
        <div className="rounded-3xl border bg-muted/30 p-12 flex flex-col items-center justify-center text-center gap-4 border-dashed">
          <div className="size-16 rounded-full bg-background flex items-center justify-center shadow-sm">
            <Landmark className="size-8 text-muted-foreground/50" />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="text-2xl font-semibold">Em breve</h2>
            <p className="text-muted-foreground">
              Estamos preparando uma experiência completa de Open Banking para você gerenciar suas finanças com mais inteligência.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
