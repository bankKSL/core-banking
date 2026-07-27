import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchReassignmentTemplate,
  executeReassignment,
} from "../api/loanReassignment";
import type { ReassignmentRequest } from "../api/loanReassignment";

export const reassignKeys = {
  all: ["loanReassignment"] as const,
  template: () => ["loanReassignment", "template"] as const,
};

export function useReassignmentTemplate() {
  return useQuery({
    queryKey: reassignKeys.template(),
    queryFn: () => fetchReassignmentTemplate(),
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
