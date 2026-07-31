import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLoanOriginators,
  fetchLoanOriginator,
  fetchLoanOriginatorByExternalId,
  fetchLoanOriginatorTemplate,
  createLoanOriginator,
  updateLoanOriginator,
  deleteLoanOriginator,
} from "../api/loanOriginators";
import type {
  LoanOriginatorRequest,
  LoanOriginatorUpdateRequest,
} from "../types/loanOriginator";

export const loanOriginatorKeys = {
  all: ["loan-originators"] as const,
  lists: () => [...loanOriginatorKeys.all, "list"] as const,
  detail: (id: number | string) => [...loanOriginatorKeys.all, "detail", id] as const,
  template: () => [...loanOriginatorKeys.all, "template"] as const,
};

export function useLoanOriginators() {
  return useQuery({
    queryKey: loanOriginatorKeys.lists(),
    queryFn: fetchLoanOriginators,
  });
}

export function useLoanOriginator(id: number | string | undefined) {
  return useQuery({
    queryKey: loanOriginatorKeys.detail(id!),
    queryFn: () => fetchLoanOriginator(id!),
    enabled: !!id,
  });
}

export function useLoanOriginatorByExternalId(externalId: string | undefined) {
  return useQuery({
    queryKey: loanOriginatorKeys.detail(externalId!),
    queryFn: () => fetchLoanOriginatorByExternalId(externalId!),
    enabled: !!externalId,
  });
}

export function useLoanOriginatorTemplate() {
  return useQuery({
    queryKey: loanOriginatorKeys.template(),
    queryFn: fetchLoanOriginatorTemplate,
    staleTime: 5 * 60_000,
  });
}

export function useCreateLoanOriginator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoanOriginatorRequest) => createLoanOriginator(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loanOriginatorKeys.lists() });
    },
  });
}

export function useUpdateLoanOriginator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: LoanOriginatorUpdateRequest }) =>
      updateLoanOriginator(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: loanOriginatorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: loanOriginatorKeys.detail(variables.id) });
    },
  });
}

export function useDeleteLoanOriginator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteLoanOriginator(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loanOriginatorKeys.lists() });
    },
  });
}
