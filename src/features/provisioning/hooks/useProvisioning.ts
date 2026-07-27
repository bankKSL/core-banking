import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProvisioningCategories,
  createProvisioningCategory,
  updateProvisioningCategory,
  deleteProvisioningCategory,
  fetchProvisioningCriterias,
  fetchProvisioningCriteria,
  fetchProvisioningCriteriaTemplate,
  createProvisioningCriteria,
  updateProvisioningCriteria,
  deleteProvisioningCriteria,
} from "../api/provisioning";

// ─── Query Keys ─────────────────────────────────────────────

export const provisioningKeys = {
  all: ["provisioning"] as const,
  categories: {
    all: () => [...provisioningKeys.all, "categories"] as const,
  },
  criterias: {
    all: () => [...provisioningKeys.all, "criterias"] as const,
    detail: (id: number) => [...provisioningKeys.all, "criterias", id] as const,
    template: () => [...provisioningKeys.all, "criterias", "template"] as const,
  },
};

// ─── Category Hooks ─────────────────────────────────────────

export function useProvisioningCategories() {
  return useQuery({
    queryKey: provisioningKeys.categories.all(),
    queryFn: fetchProvisioningCategories,
  });
}

export function useCreateProvisioningCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { categoryName: string; categoryDescription?: string }) =>
      createProvisioningCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provisioningKeys.categories.all() });
    },
  });
}

export function useUpdateProvisioningCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { categoryName: string; categoryDescription?: string };
    }) => updateProvisioningCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provisioningKeys.categories.all() });
    },
  });
}

export function useDeleteProvisioningCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProvisioningCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provisioningKeys.categories.all() });
    },
  });
}

// ─── Criteria Hooks ─────────────────────────────────────────

export function useProvisioningCriterias() {
  return useQuery({
    queryKey: provisioningKeys.criterias.all(),
    queryFn: fetchProvisioningCriterias,
  });
}

export function useProvisioningCriteria(id: number | undefined) {
  return useQuery({
    queryKey: provisioningKeys.criterias.detail(id!),
    queryFn: () => fetchProvisioningCriteria(id!),
    enabled: !!id,
  });
}

export function useProvisioningCriteriaTemplate() {
  return useQuery({
    queryKey: provisioningKeys.criterias.template(),
    queryFn: fetchProvisioningCriteriaTemplate,
  });
}

export function useCreateProvisioningCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createProvisioningCriteria(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provisioningKeys.criterias.all() });
    },
  });
}

export function useUpdateProvisioningCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateProvisioningCriteria(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: provisioningKeys.criterias.all() });
      queryClient.invalidateQueries({ queryKey: provisioningKeys.criterias.detail(id) });
    },
  });
}

export function useDeleteProvisioningCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProvisioningCriteria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provisioningKeys.criterias.all() });
    },
  });
}
