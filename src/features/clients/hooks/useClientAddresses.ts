import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchClientAddresses,
    fetchClientAddressTemplate,
    createClientAddress,
    updateClientAddress,
    deleteClientAddress,
} from "../api/addresses";
import type { ClientAddressRequest } from "../api/addresses";
import { clientKeys } from "./useClients";

export const clientAddressKeys = {
    all: (clientId: number | string) => [...clientKeys.detail(clientId), "addresses"] as const,
    template: ["clients", "addresses", "template"] as const,
};

export function useClientAddresses(clientId: number | string | undefined) {
    return useQuery({
        queryKey: clientAddressKeys.all(clientId!),
        queryFn: () => fetchClientAddresses(clientId!),
        enabled: !!clientId,
    });
}

export function useClientAddressTemplate() {
    return useQuery({
        queryKey: clientAddressKeys.template,
        queryFn: fetchClientAddressTemplate,
        staleTime: 5 * 60_000,
    });
}

export function useCreateClientAddress() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, addressTypeId, payload }: { clientId: number | string; addressTypeId: number; payload: ClientAddressRequest }) =>
            createClientAddress(clientId, addressTypeId, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: clientAddressKeys.all(variables.clientId) });
        },
    });
}

export function useUpdateClientAddress() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, addressId, payload }: { clientId: number | string; addressId: number | string; payload: ClientAddressRequest }) =>
            updateClientAddress(clientId, addressId, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: clientAddressKeys.all(variables.clientId) });
        },
    });
}

export function useDeleteClientAddress() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, addressId }: { clientId: number | string; addressId: number | string }) =>
            deleteClientAddress(clientId, addressId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: clientAddressKeys.all(variables.clientId) });
        },
    });
}
