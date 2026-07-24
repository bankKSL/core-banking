import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  fetchProvisioningEntries,
  fetchProvisioningEntry,
  createProvisioningEntry,
  provisioningEntryCommand,
} from "../api/accounting";
import type { CreateProvisioningEntryRequest } from "../types/accounting";

export const provisioningEntryKeys = {
  all: ["provisioningentries"] as const,
  list: (params: { offset?: number; limit?: number }) => ["provisioningentries", "list", params] as const,
  detail: (id: number | string) => ["provisioningentries", "detail", id] as const,
};

export function useProvisioningEntries(params: { offset?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: provisioningEntryKeys.list(params),
    queryFn: () => fetchProvisioningEntries(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useProvisioningEntry(id: number | string | undefined) {
  return useQuery({
    queryKey: provisioningEntryKeys.detail(id!),
    queryFn: () => fetchProvisioningEntry(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateProvisioningEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProvisioningEntryRequest) => createProvisioningEntry(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: provisioningEntryKeys.all });
    },
  });
}

export function useProvisioningEntryCommand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      entryId,
      command,
    }: {
      entryId: number | string;
      command: "createjournalentry" | "recreateprovisioningentry";
    }) => provisioningEntryCommand(entryId, command),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: provisioningEntryKeys.all });
    },
  });
}
