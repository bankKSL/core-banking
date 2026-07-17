import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activateClient } from "../api/client";
import type { ClientActivateRequest } from "../types/client";
import { clientKeys } from "./useClients";

/**
 * Mutation hook for activating a pending client.
 * Invalidates all client queries on success.
 */
export function useActivateClient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            clientId,
            payload = {},
        }: {
            clientId: number | string;
            payload?: ClientActivateRequest;
        }) => activateClient(clientId, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: clientKeys.all });
            queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.clientId) });
        },
    });
}
