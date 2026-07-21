import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchClientCharges,
    fetchClientChargesTemplate,
    createClientCharge,
    waiveClientCharge,
    deleteClientCharge,
} from "../api/charges";
import type { PostClientChargeRequest } from "../api/charges";
import { clientKeys } from "./useClients";

export const clientChargeKeys = {
    all: (clientId: number | string) => [...clientKeys.detail(clientId), "charges"] as const,
    template: (clientId: number | string) => [...clientKeys.detail(clientId), "charges", "template"] as const,
};

export function useClientCharges(clientId: number | string | undefined) {
    return useQuery({
        queryKey: clientChargeKeys.all(clientId!),
        queryFn: () => fetchClientCharges(clientId!),
        enabled: !!clientId,
    });
}

export function useClientChargesTemplate(clientId: number | string | undefined) {
    return useQuery({
        queryKey: clientChargeKeys.template(clientId!),
        queryFn: () => fetchClientChargesTemplate(clientId!),
        enabled: !!clientId,
    });
}

export function useCreateClientCharge() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, payload }: { clientId: number | string; payload: PostClientChargeRequest }) =>
            createClientCharge(clientId, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: clientChargeKeys.all(variables.clientId) });
        },
    });
}

export function useWaiveClientCharge() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, chargeId }: { clientId: number | string; chargeId: number | string }) =>
            waiveClientCharge(clientId, chargeId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: clientChargeKeys.all(variables.clientId) });
        },
    });
}

export function useDeleteClientCharge() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, chargeId }: { clientId: number | string; chargeId: number | string }) =>
            deleteClientCharge(clientId, chargeId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: clientChargeKeys.all(variables.clientId) });
        },
    });
}
