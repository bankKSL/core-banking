import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loanKeys } from "@/features/loans/hooks/useLoans";
import {
  fetchLoanOriginatorsByLoan,
  attachLoanOriginator,
  detachLoanOriginator,
} from "../api/loanOriginatorMapping";

export function useLoanOriginatorsByLoan(loanId: number | string | undefined) {
  return useQuery({
    queryKey: loanKeys.originators(loanId!),
    queryFn: () => fetchLoanOriginatorsByLoan(loanId!),
    enabled: !!loanId,
    staleTime: 30_000,
  });
}

export function useAttachLoanOriginator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, originatorId }: { loanId: number | string; originatorId: number }) =>
      attachLoanOriginator(loanId, originatorId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: loanKeys.originators(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: loanKeys.detail(variables.loanId) });
    },
  });
}

export function useDetachLoanOriginator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, originatorId }: { loanId: number | string; originatorId: number }) =>
      detachLoanOriginator(loanId, originatorId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: loanKeys.originators(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: loanKeys.detail(variables.loanId) });
    },
  });
}
