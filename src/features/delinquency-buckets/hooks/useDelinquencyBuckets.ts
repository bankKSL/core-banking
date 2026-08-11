import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDelinquencyBuckets,
  fetchDelinquencyBucket,
  fetchDelinquencyBucketTemplate,
  createDelinquencyBucket,
  updateDelinquencyBucket,
  deleteDelinquencyBucket,
} from "../api/delinquencyBuckets";
import type { DelinquencyBucketCreateRequest, DelinquencyBucketUpdateRequest } from "../types/delinquencyBucket";

export const delinquencyBucketKeys = {
  all: ["delinquencyBuckets"] as const,
  list: ["delinquencyBuckets", "list"] as const,
  detail: (id: number) => ["delinquencyBuckets", "detail", id] as const,
  template: ["delinquencyBuckets", "template"] as const,
};

export function useDelinquencyBuckets() {
  return useQuery({
    queryKey: delinquencyBucketKeys.list,
    queryFn: fetchDelinquencyBuckets,
  });
}

export function useDelinquencyBucket(id: number | undefined) {
  return useQuery({
    queryKey: delinquencyBucketKeys.detail(id!),
    queryFn: () => fetchDelinquencyBucket(id!),
    enabled: !!id,
  });
}

export function useDelinquencyBucketTemplate() {
  return useQuery({
    queryKey: delinquencyBucketKeys.template,
    queryFn: fetchDelinquencyBucketTemplate,
    staleTime: 10 * 60_000,
  });
}

export function useCreateDelinquencyBucket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DelinquencyBucketCreateRequest) => createDelinquencyBucket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: delinquencyBucketKeys.all });
    },
  });
}

export function useUpdateDelinquencyBucket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DelinquencyBucketUpdateRequest }) =>
      updateDelinquencyBucket(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: delinquencyBucketKeys.all });
      queryClient.invalidateQueries({ queryKey: delinquencyBucketKeys.detail(variables.id) });
    },
  });
}

export function useDeleteDelinquencyBucket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDelinquencyBucket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: delinquencyBucketKeys.all });
    },
  });
}
