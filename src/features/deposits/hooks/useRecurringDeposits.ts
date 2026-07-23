import { useQuery } from "@tanstack/react-query";
import { fetchRecurringDepositAccounts, fetchRecurringDepositAccount } from "../api/deposit";
import type { FixedDepositListParams } from "../types/deposit";
import { depositKeys } from "./useSavingsAccounts";

export function useRecurringDepositAccounts(params: FixedDepositListParams = {}) {
  return useQuery({
    queryKey: depositKeys.recurringList(params),
    queryFn: () => fetchRecurringDepositAccounts(params),
    staleTime: 30_000,
  });
}

export function useRecurringDepositAccount(accountId: number | string | undefined) {
  return useQuery({
    queryKey: depositKeys.recurringDetail(accountId!),
    queryFn: () => fetchRecurringDepositAccount(accountId!),
    enabled: !!accountId,
    staleTime: 60_000,
  });
}
