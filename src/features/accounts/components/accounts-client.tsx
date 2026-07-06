"use client"

import { AccountCard } from "./account-card"
import { AddAccountCard } from "./add-account-card"
import { SectionCardsGrid } from "@/components/section-cards-grid"
import type { AccountWithBalance } from "../types"

interface AccountsClientProps {
    initialAccounts: AccountWithBalance[]
}

export function AccountsClient({ initialAccounts }: AccountsClientProps) {
    return (
        <SectionCardsGrid className="lg:grid-cols-3 xl:grid-cols-3">
            {initialAccounts.map((account) => (
                <AccountCard
                    key={account.id}
                    name={account.name}
                    type={account.type}
                    currentBalance={account.currentBalance}
                    initialBalance={account.initialBalance}
                    legacyDate={account.legacyDate}
                />
            ))}
            <AddAccountCard />
        </SectionCardsGrid>
    )
}
