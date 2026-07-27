import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchStaffList, fetchStaff, createStaff, updateStaff } from "../api/staff";
import type { StaffCreateRequest, StaffUpdateRequest } from "../api/staff";

export const staffKeys = {
  all: ["staff"] as const,
  list: (params?: { officeId?: number; loanOfficersOnly?: boolean; status?: string }) =>
    [...staffKeys.all, "list", params] as const,
  detail: (id: number) => [...staffKeys.all, "detail", id] as const,
};

export function useStaffList(params?: { officeId?: number; loanOfficersOnly?: boolean; status?: string }) {
  return useQuery({
    queryKey: staffKeys.list(params),
    queryFn: () => fetchStaffList(params),
    placeholderData: (prev) => prev,
  });
}

export function useStaff(id: number | undefined) {
  return useQuery({
    queryKey: staffKeys.detail(id!),
    queryFn: () => fetchStaff(id!),
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StaffCreateRequest) => createStaff(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: StaffUpdateRequest }) =>
      updateStaff(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(id) });
    },
  });
}
