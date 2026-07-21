import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSavingsTransactions, undoSavingsTransaction } from "../api/deposit";
import { depositKeys } from "./useSavingsAccounts";

export const savingsTransactionKeys = {
    all: (accountId: number | string) => [...depositKeys.savingsDetail(accountId), "transactions"] as const,
};

export function useSavingsTransactions(accountId: number | string | undefined) {
    return useQuery({
        queryKey: savingsTransactionKeys.all(accountId!),
        queryFn: () => fetchSavingsTransactions(accountId!),
        enabled: !!accountId,
    });
}

export function useUndoSavingsTransaction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ accountId, transactionId }: { accountId: number | string; transactionId: number | string }) => undoSavingsTransaction(accountId, transactionId),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: savingsTransactionKeys.all(variables.accountId) });
        },
    });
}
