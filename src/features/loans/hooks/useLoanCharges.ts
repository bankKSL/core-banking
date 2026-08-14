import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchLoanCharges,
  fetchLoanChargeTemplate,
  addLoanCharge,
  updateLoanCharge,
  deleteLoanCharge,
  loanChargeCommand,
} from "../api/loanCharges";
import type { LoanChargeCreateRequest, LoanChargeUpdateRequest, LoanChargeCommandRequest } from "../types/loan";
import { loanKeys } from "./useLoans";

export function useLoanCharges(loanId: number | undefined) {
  return useQuery({
    queryKey: loanKeys.charges(loanId!),
    queryFn: () => fetchLoanCharges(loanId!),
    enabled: !!loanId,
    staleTime: 30_000,
  });
}

export function useLoanChargeTemplate(loanId: number | undefined) {
  return useQuery({
    queryKey: loanKeys.chargesTemplate(loanId!),
    queryFn: () => fetchLoanChargeTemplate(loanId!),
    enabled: !!loanId,
    staleTime: 5 * 60_000,
  });
}

export function useAddLoanCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload: LoanChargeCreateRequest }) =>
      addLoanCharge(loanId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.charges(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
    },
  });
}

export function useUpdateLoanCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      chargeId,
      payload,
    }: {
      loanId: number;
      chargeId: number;
      payload: LoanChargeUpdateRequest;
    }) => updateLoanCharge(loanId, chargeId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.charges(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
    },
  });
}

export function useDeleteLoanCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, chargeId }: { loanId: number; chargeId: number }) => deleteLoanCharge(loanId, chargeId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.charges(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
    },
  });
}

/** Pay / waive / adjustment / deactivateOverdue */
export function useLoanChargeCommand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      chargeId,
      command,
      payload,
    }: {
      loanId: number;
      /** Not used for collection commands such as `deactivateOverdue`. */
      chargeId?: number;
      command: "pay" | "waive" | "adjustment" | "deactivateOverdue";
      payload?: LoanChargeCommandRequest;
    }) => loanChargeCommand(loanId, chargeId, command, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.charges(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.schedule(vars.loanId) });
    },
  });
}
