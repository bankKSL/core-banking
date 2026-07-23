import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  rejectSavingsAccount,
  withdrawSavingsAccount,
  undoRejectSavingsAccount,
  approveSavingsAccount,
  activateSavingsAccount,
  closeSavingsAccount,
} from "../api/deposit";
import { depositKeys } from "./useSavingsAccounts";

export function useRejectSavingsAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: number | string) => rejectSavingsAccount(accountId),
    onSuccess: (_data, accountId) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(accountId) });
    },
  });
}

export function useWithdrawSavingsAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: number | string) => withdrawSavingsAccount(accountId),
    onSuccess: (_data, accountId) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(accountId) });
    },
  });
}

export function useUndoRejectSavingsAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: number | string) => undoRejectSavingsAccount(accountId),
    onSuccess: (_data, accountId) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(accountId) });
    },
  });
}

interface CommandPayload {
  approvedOnDate?: string;
  activatedOnDate?: string;
  closedOnDate?: string;
  locale?: string;
  dateFormat?: string;
  note?: string;
}

export function useApproveSavingsAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: number; payload?: CommandPayload }) =>
      approveSavingsAccount(accountId, payload),
    onSuccess: (_data, { accountId }) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(accountId) });
    },
  });
}

export function useActivateSavingsAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: number; payload?: CommandPayload }) =>
      activateSavingsAccount(accountId, payload),
    onSuccess: (_data, { accountId }) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(accountId) });
    },
  });
}

export function useCloseSavingsAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: number; payload?: CommandPayload }) =>
      closeSavingsAccount(accountId, payload),
    onSuccess: (_data, { accountId }) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(accountId) });
    },
  });
}
