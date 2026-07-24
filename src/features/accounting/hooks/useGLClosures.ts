import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchGLClosures,
  fetchGLClosure,
  createGLClosure,
  updateGLClosure,
  deleteGLClosure,
} from "../api/accounting";
import type { CreateGLClosureRequest } from "../types/accounting";

export const glClosureKeys = {
  all: ["glclosures"] as const,
  list: (officeId?: number) => ["glclosures", "list", officeId] as const,
  detail: (id: number | string) => ["glclosures", "detail", id] as const,
};

export function useGLClosures(officeId?: number) {
  return useQuery({
    queryKey: glClosureKeys.list(officeId),
    queryFn: () => fetchGLClosures(officeId),
    staleTime: 30_000,
  });
}

export function useGLClosure(id: number | string | undefined, template = false) {
  return useQuery({
    queryKey: [...glClosureKeys.detail(id!), { template }],
    queryFn: () => fetchGLClosure(id!, template),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateGLClosure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGLClosureRequest) => createGLClosure(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: glClosureKeys.all });
    },
  });
}

export function useUpdateGLClosure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: { comments: string } }) =>
      updateGLClosure(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: glClosureKeys.all });
    },
  });
}

export function useDeleteGLClosure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteGLClosure(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: glClosureKeys.all });
    },
  });
}
