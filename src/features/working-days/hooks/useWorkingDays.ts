import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWorkingDays, fetchWorkingDaysTemplate, updateWorkingDays } from "../api/working-days";
import type { WorkingDaysUpdateRequest } from "../api/working-days";

export const workingDaysKeys = {
  all: ["workingDays"] as const,
  config: () => [...workingDaysKeys.all, "config"] as const,
  template: () => [...workingDaysKeys.all, "template"] as const,
};

export function useWorkingDaysConfig() {
  return useQuery({
    queryKey: workingDaysKeys.config(),
    queryFn: fetchWorkingDays,
  });
}

export function useWorkingDaysTemplate() {
  return useQuery({
    queryKey: workingDaysKeys.template(),
    queryFn: fetchWorkingDaysTemplate,
  });
}

export function useUpdateWorkingDays() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WorkingDaysUpdateRequest) => updateWorkingDays(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workingDaysKeys.all });
    },
  });
}
