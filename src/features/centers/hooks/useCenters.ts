import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  fetchCenters,
  fetchCenter,
  fetchCenterTemplate,
  createCenter,
  updateCenter,
  deleteCenter,
  activateCenter,
  closeCenter,
  associateGroups,
  disassociateGroups,
} from "../api/centers";
import type { CenterListParams } from "../api/centers";

const PAGE_SIZE = 10;

export const centerKeys = {
  all: ["centers"] as const,
  list: (params: CenterListParams) => ["centers", "list", params] as const,
  detail: (id: number) => ["centers", "detail", id] as const,
  template: (officeId?: number) => ["centers", "template", officeId] as const,
};

export function useCenters(params: CenterListParams = {}) {
  const resolvedParams: CenterListParams = { limit: PAGE_SIZE, offset: 0, paged: true, ...params };
  return useQuery({
    queryKey: centerKeys.list(resolvedParams),
    queryFn: () => fetchCenters(resolvedParams),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useCenter(id: number | undefined) {
  return useQuery({
    queryKey: centerKeys.detail(id!),
    queryFn: () => fetchCenter(id!, "groupMembers,collectionMeetingCalendar"),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCenterTemplate(officeId?: number) {
  return useQuery({
    queryKey: centerKeys.template(officeId),
    queryFn: () => fetchCenterTemplate(officeId),
    staleTime: 60_000,
  });
}

export function useCreateCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createCenter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: centerKeys.all });
    },
  });
}

export function useUpdateCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) => updateCenter(id, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: centerKeys.detail(vars.id) });
      queryClient.invalidateQueries({ queryKey: centerKeys.all });
    },
  });
}

export function useDeleteCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCenter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: centerKeys.all });
    },
  });
}

export function useActivateCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activationDate }: { id: number; activationDate: string }) => activateCenter(id, activationDate),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: centerKeys.detail(vars.id) });
      queryClient.invalidateQueries({ queryKey: centerKeys.all });
    },
  });
}

export function useCloseCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) => closeCenter(id, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: centerKeys.detail(vars.id) });
      queryClient.invalidateQueries({ queryKey: centerKeys.all });
    },
  });
}

export function useAssociateGroups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ centerId, groupIds }: { centerId: number; groupIds: number[] }) =>
      associateGroups(centerId, groupIds),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: centerKeys.detail(vars.centerId) });
    },
  });
}

export function useDisassociateGroups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ centerId, groupIds }: { centerId: number; groupIds: number[] }) =>
      disassociateGroups(centerId, groupIds),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: centerKeys.detail(vars.centerId) });
    },
  });
}
