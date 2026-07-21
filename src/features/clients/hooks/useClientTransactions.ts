import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchClientTransactions,
    undoClientTransaction,
} from "../api/transactions";
import { clientKeys } from "./useClients";

export const clientTransactionKeys = {
    all: (clientId: number | string) => [...clientKeys.detail(clientId), "transactions"] as const,
};

export function useClientTransactions(clientId: number | string | undefined) {
    return useQuery({
        queryKey: clientTransactionKeys.all(clientId!),
        queryFn: () => fetchClientTransactions(clientId!),
        enabled: !!clientId,
    });
}

export function useUndoClientTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, transactionId }: { clientId: number | string; transactionId: number | string }) =>
            undoClientTransaction(clientId, transactionId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: clientTransactionKeys.all(variables.clientId) });
        },
    });
}
