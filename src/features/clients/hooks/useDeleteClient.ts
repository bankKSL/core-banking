import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteClient } from "../api/client";
import { clientKeys } from "./useClients";

/**
 * Mutation hook for deleting a client.
 * Finfact may or may not support this — handle gracefully.
 */
export function useDeleteClient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (clientId: number | string) => deleteClient(clientId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientKeys.all });
        },
    });
}
