import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDelinquencyRanges,
  fetchDelinquencyRange,
  createDelinquencyRange,
  updateDelinquencyRange,
  deleteDelinquencyRange,
} from "../api/delinquencyRanges";
import type { DelinquencyRangeCreateRequest, DelinquencyRangeUpdateRequest } from "../types/delinquencyRange";

export const delinquencyRangeKeys = {
  all: ["delinquencyRanges"] as const,
  list: ["delinquencyRanges", "list"] as const,
  detail: (id: number) => ["delinquencyRanges", "detail", id] as const,
};

export function useDelinquencyRanges() {
  return useQuery({
    queryKey: delinquencyRangeKeys.list,
    queryFn: fetchDelinquencyRanges,
  });
}

export function useDelinquencyRange(id: number | undefined) {
  return useQuery({
    queryKey: delinquencyRangeKeys.detail(id!),
    queryFn: () => fetchDelinquencyRange(id!),
    enabled: !!id,
  });
}

export function useCreateDelinquencyRange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DelinquencyRangeCreateRequest) => createDelinquencyRange(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: delinquencyRangeKeys.all });
      queryClient.invalidateQueries({ queryKey: ["delinquencyBuckets", "template"] });
    },
  });
}

export function useUpdateDelinquencyRange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DelinquencyRangeUpdateRequest }) =>
      updateDelinquencyRange(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: delinquencyRangeKeys.all });
      queryClient.invalidateQueries({ queryKey: delinquencyRangeKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["delinquencyBuckets", "template"] });
    },
  });
}

export function useDeleteDelinquencyRange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDelinquencyRange(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: delinquencyRangeKeys.all });
      queryClient.invalidateQueries({ queryKey: ["delinquencyBuckets", "template"] });
    },
  });
}
