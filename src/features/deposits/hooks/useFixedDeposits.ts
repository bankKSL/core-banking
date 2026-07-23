import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchFixedDepositAccounts, fetchFixedDepositAccount } from "../api/deposit";
import type { FixedDepositListParams } from "../types/deposit";
import { depositKeys } from "./useSavingsAccounts";

export function useFixedDepositAccounts(params: FixedDepositListParams = {}) {
  return useQuery({
    queryKey: depositKeys.fixedList(params),
    queryFn: () => fetchFixedDepositAccounts(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useFixedDepositAccount(accountId: number | string | undefined) {
  return useQuery({
    queryKey: depositKeys.fixedDetail(accountId!),
    queryFn: () => fetchFixedDepositAccount(accountId!),
    enabled: !!accountId,
    staleTime: 60_000,
  });
}
