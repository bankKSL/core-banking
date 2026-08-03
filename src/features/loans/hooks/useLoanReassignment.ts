import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchReassignmentTemplate,
  executeReassignment,
} from "../api/loanReassignment";
import type { ReassignmentRequest } from "../api/loanReassignment";

export const reassignKeys = {
  all: ["loanReassignment"] as const,
  template: (officeId: number) => ["loanReassignment", "template", officeId] as const,
};

/** doc §7.32: `officeId` is required. */
export function useReassignmentTemplate(officeId: number | undefined) {
  return useQuery({
    queryKey: reassignKeys.template(officeId!),
    queryFn: () => fetchReassignmentTemplate(officeId!),
    enabled: !!officeId,
    staleTime: 5 * 60_000,
  });
}

export function useExecuteReassignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReassignmentRequest) => executeReassignment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reassignKeys.all });
    },
  });
}
