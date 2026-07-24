import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchFinancialActivityAccounts,
  fetchFinancialActivityAccountTemplate,
  createFinancialActivityMapping,
  updateFinancialActivityMapping,
  deleteFinancialActivityMapping,
} from "../api/accounting";
import type { CreateFinancialActivityMappingRequest } from "../types/accounting";

export const financialActivityAccountKeys = {
  all: ["financialactivityaccounts"] as const,
  list: ["financialactivityaccounts", "list"] as const,
  template: ["financialactivityaccounts", "template"] as const,
};

export function useFinancialActivityAccounts() {
  return useQuery({
    queryKey: financialActivityAccountKeys.list,
    queryFn: () => fetchFinancialActivityAccounts(),
    staleTime: 60_000,
  });
}

export function useFinancialActivityAccountTemplate() {
  return useQuery({
    queryKey: financialActivityAccountKeys.template,
    queryFn: () => fetchFinancialActivityAccountTemplate(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateFinancialActivityMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFinancialActivityMappingRequest) => createFinancialActivityMapping(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financialActivityAccountKeys.all });
    },
  });
}

export function useUpdateFinancialActivityMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: Partial<CreateFinancialActivityMappingRequest> }) =>
      updateFinancialActivityMapping(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financialActivityAccountKeys.all });
    },
  });
}

export function useDeleteFinancialActivityMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteFinancialActivityMapping(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financialActivityAccountKeys.all });
    },
  });
}
