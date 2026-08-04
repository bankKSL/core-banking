import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchReassignmentTemplate, executeReassignment } from "../api/loanReassignment";
import type { ReassignmentRequest } from "../api/loanReassignment";

export const reassignKeys = {
  all: ["loanReassignment"] as const,
  template: (officeId?: number, fromLoanOfficerId?: number) =>
    ["loanReassignment", "template", officeId ?? null, fromLoanOfficerId ?? null] as const,
};

export function useReassignmentTemplate(officeId?: number, fromLoanOfficerId?: number) {
  return useQuery({
    queryKey: reassignKeys.template(officeId, fromLoanOfficerId),
    queryFn: () => fetchReassignmentTemplate(officeId, fromLoanOfficerId),
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
