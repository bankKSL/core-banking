import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchRecurringDepositTransactions,
  undoRecurringDepositTransaction,
  makeRecurringDepositTransaction,
} from "../api/deposit";
import type { SavingsTransactionRequest } from "../types/deposit";
import { depositKeys } from "./useSavingsAccounts";

export const rdTransactionKeys = {
  all: (accountId: number | string) => [...depositKeys.recurringDetail(accountId), "transactions"] as const,
};

export function useRecurringDepositTransactions(accountId: number | string | undefined) {
  return useQuery({
    queryKey: rdTransactionKeys.all(accountId!),
    queryFn: () => fetchRecurringDepositTransactions(accountId!),
    enabled: !!accountId,
  });
}

export function useUndoRecurringDepositTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, transactionId }: { accountId: number | string; transactionId: number | string }) =>
      undoRecurringDepositTransaction(accountId, transactionId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: rdTransactionKeys.all(variables.accountId) });
    },
  });
}

export function useMakeRecurringDepositTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      command,
      payload,
    }: {
      accountId: number | string;
      command: "deposit" | "withdrawal";
      payload: SavingsTransactionRequest;
    }) => makeRecurringDepositTransaction(accountId, command, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: rdTransactionKeys.all(variables.accountId) });
      qc.invalidateQueries({ queryKey: depositKeys.recurringDetail(variables.accountId) });
    },
  });
}
