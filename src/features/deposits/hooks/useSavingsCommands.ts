import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  rejectSavingsAccount,
  withdrawSavingsAccount,
  undoRejectSavingsAccount,
  approveSavingsAccount,
  activateSavingsAccount,
  closeSavingsAccount,
  deleteSavingsAccount,
  undoApproveSavingsAccount,
  forceWithdrawalSavings,
  applyAnnualFeesSavings,
  assignSavingsOfficer,
  unassignSavingsOfficer,
  adjustSavingsTransaction,
  deleteSavingsProduct,
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

export function useDeleteSavingsAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: number) => deleteSavingsAccount(accountId),
    onSuccess: (_data, accountId) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(accountId) });
    },
  });
}

export function useUndoApproveSavingsAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: number) => undoApproveSavingsAccount(accountId),
    onSuccess: (_data, accountId) => {
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

export function useDeleteSavingsProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => deleteSavingsProduct(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["savingsProducts"] }),
  });
}

export function useForceWithdrawalSavings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: number; payload: Record<string, unknown> }) =>
      forceWithdrawalSavings(accountId, payload),
    onSuccess: (_data, { accountId }) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(accountId) });
    },
  });
}

export function useApplyAnnualFeesSavings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: number) => applyAnnualFeesSavings(accountId),
    onSuccess: (_, accountId) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(accountId) });
    },
  });
}

export function useAssignSavingsOfficer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, officerId, assignmentDate }: { accountId: number; officerId: number; assignmentDate?: string }) =>
      assignSavingsOfficer(accountId, officerId, assignmentDate),
    onSuccess: (_data, { accountId }) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(accountId) });
    },
  });
}

export function useUnassignSavingsOfficer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, unassignedDate }: { accountId: number; unassignedDate?: string }) => unassignSavingsOfficer(accountId, unassignedDate),
    onSuccess: (_data, { accountId }) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(accountId) });
    },
  });
}

export function useAdjustSavingsTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      transactionId,
      command,
      payload,
    }: {
      accountId: number;
      transactionId: number;
      command: "undo" | "reverse" | "modify";
      payload?: Record<string, unknown>;
    }) => adjustSavingsTransaction(accountId, transactionId, command, payload),
    onSuccess: (_data, { accountId }) => {
      qc.invalidateQueries({ queryKey: depositKeys.all });
      qc.invalidateQueries({ queryKey: depositKeys.savingsDetail(accountId) });
    },
  });
}
