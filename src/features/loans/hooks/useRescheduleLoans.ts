import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchRescheduleTemplate,
  fetchRescheduleRequests,
  fetchRescheduleRequest,
  createRescheduleRequest,
  rescheduleRequestCommand,
} from "../api/rescheduleLoans";
import type { RescheduleLoanCreateRequest, RescheduleLoanCommandRequest } from "../types/loan";
import { loanKeys } from "./useLoans";

export const rescheduleLoanKeys = {
  all: ["rescheduleLoans"] as const,
  list: () => ["rescheduleLoans", "list"] as const,
  detail: (id: number | string) => ["rescheduleLoans", "detail", id] as const,
  template: ["rescheduleLoans", "template"] as const,
};

export function useRescheduleTemplate() {
  return useQuery({
    queryKey: rescheduleLoanKeys.template,
    queryFn: () => fetchRescheduleTemplate(),
    staleTime: 10 * 60_000,
  });
}

export function useRescheduleRequests() {
  return useQuery({
    queryKey: rescheduleLoanKeys.list(),
    queryFn: () => fetchRescheduleRequests(),
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
      // Approved rescheduling changes the underlying loan schedule
      qc.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}
