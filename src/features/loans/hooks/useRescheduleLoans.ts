import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchRescheduleTemplate,
  fetchRescheduleRequests,
  fetchRescheduleRequest,
  fetchReschedulePreview,
  createRescheduleRequest,
  rescheduleRequestCommand,
} from "../api/rescheduleLoans";
import type { RescheduleLoanCreateRequest, RescheduleLoanCommandRequest } from "../types/loan";
import { loanKeys } from "./useLoans";

export const rescheduleLoanKeys = {
  all: ["rescheduleLoans"] as const,
  list: (params?: { command?: string; loanId?: number }) => ["rescheduleLoans", "list", params] as const,
  detail: (id: number | string) => ["rescheduleLoans", "detail", id] as const,
  preview: (id: number | string) => ["rescheduleLoans", "preview", id] as const,
  template: ["rescheduleLoans", "template"] as const,
};

export function useRescheduleTemplate() {
  return useQuery({
    queryKey: rescheduleLoanKeys.template,
    queryFn: () => fetchRescheduleTemplate(),
    staleTime: 5 * 60_000,
  });
}

export function useRescheduleRequests(params?: { command?: string; loanId?: number }) {
  return useQuery({
    queryKey: rescheduleLoanKeys.list(params),
    queryFn: () => fetchRescheduleRequests(params),
    staleTime: 30_000,
  });
}

export function useRescheduleRequest(scheduleId: number | string | undefined) {
  return useQuery({
    queryKey: rescheduleLoanKeys.detail(scheduleId!),
    queryFn: () => fetchRescheduleRequest(scheduleId!),
    enabled: !!scheduleId,
    staleTime: 30_000,
  });
}

export function useReschedulePreview(scheduleId: number | string | undefined) {
  return useQuery({
    queryKey: rescheduleLoanKeys.preview(scheduleId!),
    queryFn: () => fetchReschedulePreview(scheduleId!),
    enabled: !!scheduleId,
    staleTime: 30_000,
  });
}

export function useCreateRescheduleRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RescheduleLoanCreateRequest) => createRescheduleRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rescheduleLoanKeys.all });
    },
  });
}

export function useRescheduleRequestCommand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      command,
      payload,
    }: {
      scheduleId: number;
      command: "approve" | "reject";
      payload?: RescheduleLoanCommandRequest;
    }) => rescheduleRequestCommand(scheduleId, command, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rescheduleLoanKeys.all });
      qc.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}
