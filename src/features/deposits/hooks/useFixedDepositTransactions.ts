import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchFixedDepositTransactions,
  undoFixedDepositTransaction,
  makeFixedDepositTransaction,
} from "../api/deposit";
import type { SavingsTransactionRequest } from "../types/deposit";
import { depositKeys } from "./useSavingsAccounts";

export const fdTransactionKeys = {
  all: (accountId: number | string) => [...depositKeys.fixedDetail(accountId), "transactions"] as const,
};

export function useFixedDepositTransactions(accountId: number | string | undefined) {
  return useQuery({
    queryKey: fdTransactionKeys.all(accountId!),
    queryFn: () => fetchFixedDepositTransactions(accountId!),
    enabled: !!accountId,
  });
}

export function useUndoFixedDepositTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, transactionId }: { accountId: number | string; transactionId: number | string }) =>
      undoFixedDepositTransaction(accountId, transactionId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: fdTransactionKeys.all(variables.accountId) });
    },
  });
}

export function useMakeFixedDepositTransaction() {
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
    }) => makeFixedDepositTransaction(accountId, command, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: fdTransactionKeys.all(variables.accountId) });
    },
  });
}
