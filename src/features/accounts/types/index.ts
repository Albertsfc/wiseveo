export type AccountType = "WALLET" | "CHECKING" | "SAVINGS" | "INVESTMENT";

export interface AccountWithBalance {
    id: number;
    name: string;
    type: AccountType;
    initialBalance: number;
    currentBalance: number;
    legacyDate: string;
}
