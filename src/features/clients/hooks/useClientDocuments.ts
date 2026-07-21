import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchClientDocuments,
    fetchClientDocument,
    downloadClientDocument,
    createClientDocument,
    updateClientDocument,
    deleteClientDocument,
} from "../api/documents";
import type { ClientDocumentRequest } from "../api/documents";
import { clientKeys } from "./useClients";

export const clientDocumentKeys = {
    all: (clientId: number | string) => [...clientKeys.detail(clientId), "documents"] as const,
    detail: (clientId: number | string, documentId: number | string) => [...clientKeys.detail(clientId), "documents", documentId] as const,
};

export function useClientDocuments(clientId: number | string | undefined) {
    return useQuery({
        queryKey: clientDocumentKeys.all(clientId!),
        queryFn: () => fetchClientDocuments(clientId!),
        enabled: !!clientId,
    });
}

export function useClientDocument(clientId: number | string | undefined, documentId: number | string | undefined) {
    return useQuery({
        queryKey: clientDocumentKeys.detail(clientId!, documentId!),
        queryFn: () => fetchClientDocument(clientId!, documentId!),
        enabled: !!clientId && !!documentId,
    });
}

export function useCreateClientDocument() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, payload }: { clientId: number | string; payload: ClientDocumentRequest }) =>
            createClientDocument(clientId, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: clientDocumentKeys.all(variables.clientId) });
        },
    });
}

export function useUpdateClientDocument() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, documentId, payload }: { clientId: number | string; documentId: number | string; payload: ClientDocumentRequest }) =>
            updateClientDocument(clientId, documentId, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: clientDocumentKeys.all(variables.clientId) });
        },
    });
}

export function useDeleteClientDocument() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, documentId }: { clientId: number | string; documentId: number | string }) =>
            deleteClientDocument(clientId, documentId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: clientDocumentKeys.all(variables.clientId) });
        },
    });
}
