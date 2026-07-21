import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFixedDepositTransactions, undoFixedDepositTransaction } from "../api/deposit";
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
        mutationFn: ({ accountId, transactionId }: { accountId: number | string; transactionId: number | string }) => undoFixedDepositTransaction(accountId, transactionId),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: fdTransactionKeys.all(variables.accountId) });
        },
    });
}
