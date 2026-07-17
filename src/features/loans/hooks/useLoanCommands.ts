import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    approveLoan, disburseLoan, rejectLoan, closeLoan,
    undoApproval, undoDisbursal,
} from "../api/loan";
import type { LoanCommandRequest } from "../types/loan";
import { loanKeys } from "./useLoans";

export function useApproveLoan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ loanId, payload }: { loanId: number; payload?: LoanCommandRequest }) => approveLoan(loanId, payload),
        onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) }); qc.invalidateQueries({ queryKey: loanKeys.all }); },
    });
}

export function useDisburseLoan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ loanId, payload }: { loanId: number; payload?: LoanCommandRequest }) => disburseLoan(loanId, payload),
        onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) }); qc.invalidateQueries({ queryKey: loanKeys.all }); },
    });
}

export function useRejectLoan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ loanId, payload }: { loanId: number; payload?: LoanCommandRequest }) => rejectLoan(loanId, payload),
        onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) }); qc.invalidateQueries({ queryKey: loanKeys.all }); },
    });
}

export function useCloseLoan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ loanId, payload }: { loanId: number; payload?: LoanCommandRequest }) => closeLoan(loanId, payload),
        onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) }); qc.invalidateQueries({ queryKey: loanKeys.all }); },
    });
}

export function useUndoApproval() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (loanId: number) => undoApproval(loanId),
        onSuccess: (_, loanId) => { qc.invalidateQueries({ queryKey: loanKeys.detail(loanId) }); qc.invalidateQueries({ queryKey: loanKeys.all }); },
    });
}

export function useUndoDisbursal() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (loanId: number) => undoDisbursal(loanId),
        onSuccess: (_, loanId) => { qc.invalidateQueries({ queryKey: loanKeys.detail(loanId) }); qc.invalidateQueries({ queryKey: loanKeys.all }); },
    });
}
