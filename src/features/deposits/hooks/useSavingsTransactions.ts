import { depositKeys } from "./useSavingsAccounts";

export const savingsTransactionKeys = {
    all: (accountId: number | string) => [...depositKeys.savingsDetail(accountId), "transactions"] as const,
};
