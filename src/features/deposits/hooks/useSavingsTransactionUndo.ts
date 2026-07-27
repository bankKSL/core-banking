import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adjustSavingsTransaction } from "../api/deposit";
import { depositKeys } from "./useSavingsAccounts";

export function useUndoSavingsTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, transactionId }: { accountId: number; transactionId: number }) =>
      adjustSavingsTransaction(accountId, transactionId, "undo"),
    onSuccess: (_data, { accountId }) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(accountId) });
    },
  });
}

export function useReverseSavingsTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, transactionId }: { accountId: number; transactionId: number }) =>
      adjustSavingsTransaction(accountId, transactionId, "reverse"),
    onSuccess: (_data, { accountId }) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(accountId) });
    },
  });
}

export function useModifySavingsTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      transactionId,
      payload,
    }: {
      accountId: number;
      transactionId: number;
      payload?: Record<string, unknown>;
    }) => adjustSavingsTransaction(accountId, transactionId, "modify", payload),
    onSuccess: (_data, { accountId }) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(accountId) });
    },
  });
}
