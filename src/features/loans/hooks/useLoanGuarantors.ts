import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchLoanGuarantors, addLoanGuarantor, updateLoanGuarantor, deleteLoanGuarantor } from "../api/loanGuarantors";
import type { LoanGuarantorCreateRequest } from "../types/loan";
import { loanKeys } from "./useLoans";

export function useLoanGuarantors(loanId: number | undefined) {
  return useQuery({
    queryKey: loanKeys.guarantors(loanId!),
    queryFn: () => fetchLoanGuarantors(loanId!),
    enabled: !!loanId,
    staleTime: 30_000,
  });
}

export function useAddLoanGuarantor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload: LoanGuarantorCreateRequest }) =>
      addLoanGuarantor(loanId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.guarantors(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
    },
  });
}

export function useUpdateLoanGuarantor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      guarantorId,
      payload,
    }: {
      loanId: number;
      guarantorId: number;
      payload: Partial<LoanGuarantorCreateRequest>;
    }) => updateLoanGuarantor(loanId, guarantorId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.guarantors(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
    },
  });
}

export function useDeleteLoanGuarantor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, guarantorId }: { loanId: number; guarantorId: number }) =>
      deleteLoanGuarantor(loanId, guarantorId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.guarantors(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
    },
  });
}
