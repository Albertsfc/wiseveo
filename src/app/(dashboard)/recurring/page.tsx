import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { getRecurring } from "@/features/recurring/services/get-recurring"
import { getDefaultUserId } from "@/features/transactions/services/get-default-user-id"
import { RecurringClient } from "@/features/recurring/components/recurring-client"
import { getFormOptions } from "@/features/transactions/services/get-form-options"

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Routes.recurring")

    return {
        title: `${t("title")} | WISEVEO`,
        description: t("description"),
    }
}

export default async function RecurringPage() {
    const userId = await getDefaultUserId()

    if (!userId) {
        const t = await getTranslations("common")
        return (
            <div className="flex items-center justify-center h-96 px-4 md:px-6">
                <p className="text-muted-foreground">
                    {t("noUserFound")}
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
