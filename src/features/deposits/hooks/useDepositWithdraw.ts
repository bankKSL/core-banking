import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeDeposit, makeWithdrawal } from "../api/deposit";
import type { SavingsTransactionRequest } from "../types/deposit";
import { depositKeys } from "./useSavingsAccounts";

export function useMakeDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: number; payload: SavingsTransactionRequest }) =>
      makeDeposit(accountId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(vars.accountId) });
    },
  });
}

export function useMakeWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: number; payload: SavingsTransactionRequest }) =>
      makeWithdrawal(accountId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(vars.accountId) });
    },
  });
}
