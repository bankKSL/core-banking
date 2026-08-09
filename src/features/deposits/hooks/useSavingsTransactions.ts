import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  holdAmountSavings,
  releaseAmountSavings,
  fetchOnHoldTransactions,
  fetchSavingsTransactions,
  searchTransactions,
} from "../api/deposit";
import type { TransactionSearchParams } from "../api/deposit";
import { depositKeys } from "./useSavingsAccounts";

export const savingsTransactionKeys = {
  all: (accountId: number | string) => [...depositKeys.savingsDetail(accountId), "transactions"] as const,
  list: (accountId: number | string) => [...savingsTransactionKeys.all(accountId), "list"] as const,
  onHold: (accountId: number | string) => [...savingsTransactionKeys.all(accountId), "onHold"] as const,
  search: (accountId: number | string, params: TransactionSearchParams) =>
    [...savingsTransactionKeys.all(accountId), "search", params] as const,
};

export function useSavingsTransactions(accountId: number | string | undefined) {
  return useQuery({
    queryKey: savingsTransactionKeys.list(accountId!),
    queryFn: () => fetchSavingsTransactions(accountId!),
    enabled: !!accountId,
    staleTime: 30_000,
  });
}

export function useOnHoldTransactions(accountId: number | string | undefined) {
  return useQuery({
    queryKey: savingsTransactionKeys.onHold(accountId!),
    queryFn: () => fetchOnHoldTransactions(accountId!),
    enabled: !!accountId,
    staleTime: 30_000,
  });
}

export function useSearchSavingsTransactions(accountId: number | string | undefined, params: TransactionSearchParams) {
  return useQuery({
    queryKey: savingsTransactionKeys.search(accountId!, params),
    queryFn: () => searchTransactions(Number(accountId!), params),
    enabled: !!accountId,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useHoldAmountSavings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      payload,
    }: {
      accountId: number | string;
      payload: {
        transactionDate: string;
        transactionAmount: number;
        reasonForBlock: string;
        lienAllowed?: boolean;
        externalId?: string;
        locale?: string;
        dateFormat?: string;
      };
    }) => holdAmountSavings(accountId, payload),
    onSuccess: (_data, { accountId }) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(accountId) });
    },
  });
}

export function useReleaseAmountSavings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      transactionId,
      payload,
    }: {
      accountId: number | string;
      transactionId: number | string;
      payload?: { externalId?: string };
    }) => releaseAmountSavings(accountId, transactionId, payload),
    onSuccess: (_data, { accountId }) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(accountId) });
    },
  });
}
