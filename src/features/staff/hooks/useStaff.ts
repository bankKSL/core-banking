import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchStaffList,
  fetchStaff,
  fetchStaffWithTemplate,
  createStaff,
  updateStaff,
  uploadStaffTemplate,
} from "../api/staff";
import type { StaffCreateRequest, StaffUpdateRequest, StaffListParams } from "../api/staff";

export const staffKeys = {
  all: ["staff"] as const,
  list: (params?: StaffListParams) => [...staffKeys.all, "list", params] as const,
  detail: (id: number) => [...staffKeys.all, "detail", id] as const,
  template: (id: number) => [...staffKeys.all, "template", id] as const,
};

export function useStaffList(params?: StaffListParams) {
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

export function useStaffWithTemplate(id: number | undefined) {
  return useQuery({
    queryKey: staffKeys.template(id!),
    queryFn: () => fetchStaffWithTemplate(id!),
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
      queryClient.invalidateQueries({ queryKey: staffKeys.template(id) });
    },
  });
}

export function useUploadStaffTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      locale,
      dateFormat,
    }: {
      file: File;
      locale?: string;
      dateFormat?: string;
    }) => uploadStaffTemplate(file, locale, dateFormat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}
