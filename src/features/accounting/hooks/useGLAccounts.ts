import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  fetchGLAccounts,
  fetchGLAccount,
  fetchGLAccountTemplate,
  createGLAccount,
  updateGLAccount,
  deleteGLAccount,
} from "../api/accounting";
import type { GLAccountListParams, CreateGLAccountRequest, UpdateGLAccountRequest } from "../types/accounting";

export const glAccountKeys = {
  all: ["glaccounts"] as const,
  list: (params: GLAccountListParams) => ["glaccounts", "list", params] as const,
  detail: (id: number | string) => ["glaccounts", "detail", id] as const,
  template: ["glaccounts", "template"] as const,
};

export function useGLAccounts(params: GLAccountListParams = {}) {
  return useQuery({
    queryKey: glAccountKeys.list(params),
    queryFn: () => fetchGLAccounts(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useGLAccount(id: number | string | undefined, template = false) {
  return useQuery({
    queryKey: [...glAccountKeys.detail(id!), { template }],
    queryFn: () => fetchGLAccount(id!, template),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useGLAccountTemplate(type?: number) {
  return useQuery({
    queryKey: [...glAccountKeys.template, type],
    queryFn: () => fetchGLAccountTemplate(type),
    staleTime: 5 * 60_000,
  });
}

export function useCreateGLAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGLAccountRequest) => createGLAccount(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: glAccountKeys.all });
    },
  });
}

export function useUpdateGLAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateGLAccountRequest }) =>
      updateGLAccount(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: glAccountKeys.all });
    },
  });
}

export function useDeleteGLAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteGLAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: glAccountKeys.all });
    },
  });
}
