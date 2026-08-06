import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  approveLoan,
  disburseLoan,
  disburseLoanToSavings,
  rejectLoan,
  closeLoan,
  undoApproval,
  undoDisbursal,
  withdrawLoanApplication,
  makeTransaction,
  undoWriteOffLoan,
} from "../api/loan";
import type { LoanCommandRequest } from "../types/loan";
import { loanKeys } from "./useLoans";

export function useApproveLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload?: LoanCommandRequest }) => approveLoan(loanId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}

export function useDisburseLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload?: LoanCommandRequest }) =>
      disburseLoan(loanId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}

export function useRejectLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload?: LoanCommandRequest }) => rejectLoan(loanId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}

export function useCloseLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload?: LoanCommandRequest }) => closeLoan(loanId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}

export function useUndoApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (loanId: number) => undoApproval(loanId),
    onSuccess: (_, loanId) => {
      qc.invalidateQueries({ queryKey: loanKeys.detail(loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}

export function useUndoDisbursal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (loanId: number) => undoDisbursal(loanId),
    onSuccess: (_, loanId) => {
      qc.invalidateQueries({ queryKey: loanKeys.detail(loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}

export function useDisburseLoanToSavings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload?: LoanCommandRequest }) =>
      disburseLoanToSavings(loanId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}

export function useWithdrawLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload?: LoanCommandRequest }) =>
      withdrawLoanApplication(loanId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}

/** Generic transaction command hook (recoverypayment, charge-off, refunds, reAge, ...) */
export function useLoanTransactionCommand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, command, payload }: { loanId: number; command: string; payload?: LoanCommandRequest }) =>
      makeTransaction(loanId, (payload ?? {}) as Record<string, unknown>, command),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.schedule(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}

/** Undo write off: POST /loans/{id}/transactions?command=undowriteoff */
export function useUndoWriteOff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload?: LoanCommandRequest }) =>
      undoWriteOffLoan(loanId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}
