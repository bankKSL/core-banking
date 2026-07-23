import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchClientIdentifiers,
  fetchClientIdentifierTemplate,
  createClientIdentifier,
  updateClientIdentifier,
  deleteClientIdentifier,
} from "../api/identifiers";
import type { ClientIdentifierRequest } from "../api/identifiers";
import { clientKeys } from "./useClients";

export const clientIdentifierKeys = {
  all: (clientId: number | string) => [...clientKeys.detail(clientId), "identifiers"] as const,
  template: (clientId: number | string) => [...clientKeys.detail(clientId), "identifiers", "template"] as const,
};

export function useClientIdentifiers(clientId: number | string | undefined) {
  return useQuery({
    queryKey: clientIdentifierKeys.all(clientId!),
    queryFn: () => fetchClientIdentifiers(clientId!),
    enabled: !!clientId,
  });
}

export function useClientIdentifierTemplate(clientId: number | string | undefined) {
  return useQuery({
    queryKey: clientIdentifierKeys.template(clientId!),
    queryFn: () => fetchClientIdentifierTemplate(clientId!),
    enabled: !!clientId,
  });
}

export function useCreateClientIdentifier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, payload }: { clientId: number | string; payload: ClientIdentifierRequest }) =>
      createClientIdentifier(clientId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clientIdentifierKeys.all(variables.clientId) });
    },
  });
}

export function useUpdateClientIdentifier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      identifierId,
      payload,
    }: {
      clientId: number | string;
      identifierId: number | string;
      payload: Partial<ClientIdentifierRequest>;
    }) => updateClientIdentifier(clientId, identifierId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clientIdentifierKeys.all(variables.clientId) });
    },
  });
}

export function useDeleteClientIdentifier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, identifierId }: { clientId: number | string; identifierId: number | string }) =>
      deleteClientIdentifier(clientId, identifierId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clientIdentifierKeys.all(variables.clientId) });
    },
  });
}
