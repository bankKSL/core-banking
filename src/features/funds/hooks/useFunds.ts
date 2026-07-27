import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFunds, fetchFund, createFund, updateFund } from "../api/funds";
import type { FundCreateRequest, FundUpdateRequest } from "../api/funds";

export const fundKeys = {
  all: ["funds"] as const,
  list: (params?: Record<string, unknown>) => [...fundKeys.all, "list", params] as const,
  detail: (id: number) => [...fundKeys.all, "detail", id] as const,
};

export function useFunds(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: fundKeys.list(params),
    queryFn: () => fetchFunds(params),
    placeholderData: (prev) => prev,
  });
}

export function useFund(id: number | undefined) {
  return useQuery({
    queryKey: fundKeys.detail(id!),
    queryFn: () => fetchFund(id!),
    enabled: !!id,
  });
}

export function useCreateFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FundCreateRequest) => createFund(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fundKeys.all });
    },
  });
}

export function useUpdateFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FundUpdateRequest }) =>
      updateFund(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: fundKeys.all });
      queryClient.invalidateQueries({ queryKey: fundKeys.detail(id) });
    },
  });
}
