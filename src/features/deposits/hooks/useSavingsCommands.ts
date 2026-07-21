import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rejectSavingsAccount, withdrawSavingsAccount, undoRejectSavingsAccount } from "../api/deposit";
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
