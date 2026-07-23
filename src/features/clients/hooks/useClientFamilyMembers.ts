import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchClientFamilyMembers,
  fetchClientFamilyMemberTemplate,
  createClientFamilyMember,
  updateClientFamilyMember,
  deleteClientFamilyMember,
} from "../api/family-members";
import type { ClientFamilyMemberRequest } from "../api/family-members";
import { clientKeys } from "./useClients";

export const clientFamilyMemberKeys = {
  all: (clientId: number | string) => [...clientKeys.detail(clientId), "familymembers"] as const,
  template: (clientId: number | string) => [...clientKeys.detail(clientId), "familymembers", "template"] as const,
};

export function useClientFamilyMembers(clientId: number | string | undefined) {
  return useQuery({
    queryKey: clientFamilyMemberKeys.all(clientId!),
    queryFn: () => fetchClientFamilyMembers(clientId!),
    enabled: !!clientId,
  });
}

export function useClientFamilyMemberTemplate(clientId: number | string | undefined) {
  return useQuery({
    queryKey: clientFamilyMemberKeys.template(clientId!),
    queryFn: () => fetchClientFamilyMemberTemplate(clientId!),
    enabled: !!clientId,
  });
}

export function useCreateClientFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, payload }: { clientId: number | string; payload: ClientFamilyMemberRequest }) =>
      createClientFamilyMember(clientId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clientFamilyMemberKeys.all(variables.clientId) });
    },
  });
}

export function useUpdateClientFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      familyMemberId,
      payload,
    }: {
      clientId: number | string;
      familyMemberId: number | string;
      payload: Partial<ClientFamilyMemberRequest>;
    }) => updateClientFamilyMember(clientId, familyMemberId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clientFamilyMemberKeys.all(variables.clientId) });
    },
  });
}

export function useDeleteClientFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, familyMemberId }: { clientId: number | string; familyMemberId: number | string }) =>
      deleteClientFamilyMember(clientId, familyMemberId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clientFamilyMemberKeys.all(variables.clientId) });
    },
  });
}
