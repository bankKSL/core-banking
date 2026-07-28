import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTaxComponents,
  fetchTaxComponent,
  fetchTaxComponentTemplate,
  createTaxComponent,
  updateTaxComponent,
  fetchTaxGroups,
  fetchTaxGroup,
  fetchTaxGroupTemplate,
  createTaxGroup,
  updateTaxGroup,
} from "../api/taxes";

export const taxKeys = {
  all: ["taxes"] as const,
  component: {
    all: () => [...taxKeys.all, "component"] as const,
    list: () => [...taxKeys.component.all(), "list"] as const,
    detail: (id: number) => [...taxKeys.component.all(), "detail", id] as const,
    template: () => [...taxKeys.component.all(), "template"] as const,
  },
  group: {
    all: () => [...taxKeys.all, "group"] as const,
    list: () => [...taxKeys.group.all(), "list"] as const,
    detail: (id: number) => [...taxKeys.group.all(), "detail", id] as const,
    template: () => [...taxKeys.group.all(), "template"] as const,
  },
};

// Tax Component hooks
export function useTaxComponents() {
  return useQuery({
    queryKey: taxKeys.component.list(),
    queryFn: fetchTaxComponents,
    placeholderData: (prev) => prev,
  });
}

export function useTaxComponent(id: number | undefined) {
  return useQuery({
    queryKey: taxKeys.component.detail(id!),
    queryFn: () => fetchTaxComponent(id!),
    enabled: !!id,
  });
}

export function useTaxComponentTemplate() {
  return useQuery({
    queryKey: taxKeys.component.template(),
    queryFn: fetchTaxComponentTemplate,
  });
}

export function useCreateTaxComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createTaxComponent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxKeys.component.all() });
    },
  });
}

export function useUpdateTaxComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateTaxComponent(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: taxKeys.component.all() });
      queryClient.invalidateQueries({ queryKey: taxKeys.component.detail(id) });
    },
  });
}

// Tax Group hooks
export function useTaxGroups() {
  return useQuery({
    queryKey: taxKeys.group.list(),
    queryFn: fetchTaxGroups,
    placeholderData: (prev) => prev,
  });
}

export function useTaxGroup(id: number | undefined) {
  return useQuery({
    queryKey: taxKeys.group.detail(id!),
    queryFn: () => fetchTaxGroup(id!),
    enabled: !!id,
  });
}

export function useTaxGroupWithTemplate(id: number) {
  return useQuery({
    queryKey: [...taxKeys.group.detail(id), "withTemplate"] as const,
    queryFn: () => fetchTaxGroup(id, true),
  });
}

export function useTaxGroupTemplate() {
  return useQuery({
    queryKey: taxKeys.group.template(),
    queryFn: fetchTaxGroupTemplate,
  });
}

export function useCreateTaxGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createTaxGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxKeys.group.all() });
    },
  });
}

export function useUpdateTaxGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateTaxGroup(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: taxKeys.group.all() });
      queryClient.invalidateQueries({ queryKey: taxKeys.group.detail(id) });
    },
  });
}
