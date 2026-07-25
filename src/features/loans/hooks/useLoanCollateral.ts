import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchLoanCollateral,
  fetchCollateralTemplate,
  addLoanCollateral,
  updateLoanCollateral,
  deleteLoanCollateral,
} from "../api/loanCollateral";
import type { LoanCollateralCreateRequest } from "../types/loan";
import { loanKeys } from "./useLoans";

export function useCollateralTemplate() {
  return useQuery({
    queryKey: loanKeys.collateralTemplate,
    queryFn: () => fetchCollateralTemplate(),
    staleTime: 10 * 60_000,
  });
}

export function useLoanCollateral(loanId: number | undefined) {
  return useQuery({
    queryKey: loanKeys.collateral(loanId!),
    queryFn: () => fetchLoanCollateral(loanId!),
    enabled: !!loanId,
    staleTime: 30_000,
  });
}

export function useAddLoanCollateral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload: LoanCollateralCreateRequest }) =>
      addLoanCollateral(loanId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.collateral(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
    },
  });
}

export function useUpdateLoanCollateral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      collateralId,
      payload,
    }: {
      loanId: number;
      collateralId: number;
      payload: LoanCollateralCreateRequest;
    }) => updateLoanCollateral(loanId, collateralId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.collateral(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
    },
  });
}

export function useDeleteLoanCollateral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, collateralId }: { loanId: number; collateralId: number }) =>
      deleteLoanCollateral(loanId, collateralId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.collateral(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
    },
  });
}
