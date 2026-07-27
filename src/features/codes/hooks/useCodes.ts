import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCodes,
  fetchCode,
  createCode,
  updateCode,
  deleteCode,
  fetchCodeValues,
  fetchCodeValue,
  createCodeValue,
  updateCodeValue,
  deleteCodeValue,
} from "../api/codes";
import type { CodeValueCreateRequest, CodeValueUpdateRequest } from "../api/codes";

export const codeKeys = {
  all: ["codes"] as const,
  list: () => [...codeKeys.all, "list"] as const,
  detail: (id: number) => [...codeKeys.all, "detail", id] as const,
  values: (codeId: number) => [...codeKeys.all, "values", codeId] as const,
  valueDetail: (codeId: number, valueId: number) => [...codeKeys.all, "values", codeId, valueId] as const,
};

export function useCodes() {
  return useQuery({
    queryKey: codeKeys.list(),
    queryFn: fetchCodes,
  });
}

export function useCode(id: number | undefined) {
  return useQuery({
    queryKey: codeKeys.detail(id!),
    queryFn: () => fetchCode(id!),
    enabled: !!id,
  });
}

export function useCodeValues(codeId: number | undefined) {
  return useQuery({
    queryKey: codeKeys.values(codeId!),
    queryFn: () => fetchCodeValues(codeId!),
    enabled: !!codeId,
  });
}

export function useCodeValue(codeId: number | undefined, valueId: number | undefined) {
  return useQuery({
    queryKey: codeKeys.valueDetail(codeId!, valueId!),
    queryFn: () => fetchCodeValue(codeId!, valueId!),
    enabled: !!codeId && !!valueId,
  });
}

export function useCreateCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string }) => createCode(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: codeKeys.all });
    },
  });
}

export function useUpdateCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { name: string } }) => updateCode(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: codeKeys.all });
    },
  });
}

export function useDeleteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: codeKeys.all });
    },
  });
}

export function useCreateCodeValue(codeId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CodeValueCreateRequest) => createCodeValue(codeId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: codeKeys.values(codeId!) });
    },
  });
}

export function useUpdateCodeValue(codeId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ valueId, payload }: { valueId: number; payload: CodeValueUpdateRequest }) =>
      updateCodeValue(codeId!, valueId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: codeKeys.values(codeId!) });
    },
  });
}

export function useDeleteCodeValue(codeId: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (valueId: number) => deleteCodeValue(codeId!, valueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: codeKeys.values(codeId!) });
    },
  });
}
