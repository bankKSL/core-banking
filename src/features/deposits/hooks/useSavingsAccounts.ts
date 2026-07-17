import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchSavingsAccounts, fetchSavingsAccount } from "../api/deposit";
import type { SavingsAccountListParams } from "../types/deposit";
import { DEPOSIT_ACCOUNTS_PAGE_SIZE } from "../constants/status";

export const depositKeys = {
    all: ["deposits"] as const,
    savingsList: (params: SavingsAccountListParams) => ["deposits", "savings", "list", params] as const,
    savingsDetail: (id: number | string) => ["deposits", "savings", "detail", id] as const,
    savingsTemplate: ["deposits", "savings", "template"] as const,
    savingsProducts: ["deposits", "savings", "products"] as const,
    savingsProduct: (id: number) => ["deposits", "savings", "product", id] as const,
    fixedList: (params: unknown) => ["deposits", "fixed", "list", params] as const,
    fixedDetail: (id: number | string) => ["deposits", "fixed", "detail", id] as const,
    recurringList: (params: unknown) => ["deposits", "recurring", "list", params] as const,
    recurringDetail: (id: number | string) => ["deposits", "recurring", "detail", id] as const,
    depositTemplate: (id: number) => ["deposits", "depositTemplate", id] as const,
    withdrawTemplate: (id: number) => ["deposits", "withdrawTemplate", id] as const,
};

export function useSavingsAccounts(params: SavingsAccountListParams = {}) {
    const resolvedParams = { limit: DEPOSIT_ACCOUNTS_PAGE_SIZE, offset: 0, ...params };
    return useQuery({
        queryKey: depositKeys.savingsList(resolvedParams),
        queryFn: () => fetchSavingsAccounts(resolvedParams),
        placeholderData: keepPreviousData,
        staleTime: 30_000,
    });
}

export function useSavingsAccount(accountId: number | string | undefined) {
    return useQuery({
        queryKey: depositKeys.savingsDetail(accountId!),
        queryFn: () => fetchSavingsAccount(accountId!),
        enabled: !!accountId,
        staleTime: 60_000,
    });
}
