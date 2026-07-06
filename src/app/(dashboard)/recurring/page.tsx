import { getRecurring } from "@/features/recurring/services/get-recurring"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { RecurringClient } from "@/features/recurring/components/recurring-client"
import { getFormOptions } from "@/features/transactions/services/get-form-options"

export const metadata = {
    title: "Recorrentes | WISEVEO",
}

export default async function RecurringPage() {
    const userId = await getDefaultUserId()

    if (!userId) {
        return (
            <div className="flex items-center justify-center h-96 px-4 md:px-6">
                <p className="text-muted-foreground">
                    Nenhum usuário encontrado. Faça login para ver suas transações recorrentes.
                </p>
            </div>
        )
    }

    const [{ recurring, filterOptions }, formOptions] = await Promise.all([
        getRecurring(userId),
        getFormOptions(userId),
    ])

    return (
        <RecurringClient
            initialRecurring={recurring}
            filterOptions={filterOptions}
            formOptions={formOptions}
        />
    )
}
