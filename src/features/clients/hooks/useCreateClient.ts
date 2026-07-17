import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../api/client";
import type { ClientCreateRequest } from "../types/client";
import { clientKeys } from "./useClients";

/**
 * Mutation hook for creating a new client.
 * Invalidates the client list query on success.
 */
export function useCreateClient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ClientCreateRequest) => createClient(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientKeys.all });
        },
    });
}
