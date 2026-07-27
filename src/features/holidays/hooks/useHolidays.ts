import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchHolidays,
  fetchHoliday,
  fetchHolidayTemplate,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  activateHoliday,
  buildCreateRequest,
  buildUpdateRequest,
} from "../api/holidays";
import type { HolidayListParams } from "../types/holiday.types";

export const holidayKeys = {
  all: ["holidays"] as const,
  list: (params?: HolidayListParams) => [...holidayKeys.all, "list", params] as const,
  detail: (id: number) => [...holidayKeys.all, "detail", id] as const,
  template: () => [...holidayKeys.all, "template"] as const,
};

export function useHolidayTemplate() {
  return useQuery({
    queryKey: holidayKeys.template(),
    queryFn: fetchHolidayTemplate,
  });
}

export function useHolidays(params?: HolidayListParams) {
  return useQuery({
    queryKey: holidayKeys.list(params),
    queryFn: () => fetchHolidays(params),
    placeholderData: (prev) => prev,
  });
}

export function useHoliday(id: number | undefined) {
  return useQuery({
    queryKey: holidayKeys.detail(id!),
    queryFn: () => fetchHoliday(id!),
    enabled: !!id,
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      createHoliday(buildCreateRequest(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all });
    },
  });
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Record<string, unknown> }) =>
      updateHoliday(id, buildUpdateRequest(values)),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all });
      queryClient.invalidateQueries({ queryKey: holidayKeys.detail(id) });
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all });
    },
  });
}

export function useActivateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => activateHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holidayKeys.all });
    },
  });
}
