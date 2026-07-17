import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateClient } from "../api/client";
import type { ClientUpdateRequest } from "../types/client";
import { clientKeys } from "./useClients";

/**
 * Mutation hook for updating an existing client.
 * Invalidates both the list and detail queries on success.
 */
export function useUpdateClient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ clientId, payload }: { clientId: number | string; payload: ClientUpdateRequest }) => updateClient(clientId, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: clientKeys.all });
            queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.clientId) });
        },
    });
}
