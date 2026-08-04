import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchApprovedAmountHistory,
  updateApprovedAmount,
  fetchAvailableDisbursementAmount,
  updateAvailableDisbursementAmount,
  fetchReAgePreview,
  fetchReAmortizationPreview,
  fetchDelinquencyActions,
  createDelinquencyAction,
  fetchGuarantorTemplate,
  fetchGuarantorSavingsTemplate,
  type UpdateApprovedAmountPayload,
  type UpdateAvailableDisbursementAmountPayload,
  type ReAgePreviewParams,
  type ReAmortizationPreviewParams,
  type CreateDelinquencyActionPayload,
} from "../api/loanExtras";
import { loanKeys } from "./useLoans";

/** All keys live under the `loans` namespace so a single `invalidate` clears them. */
const extrasKey = (...parts: (string | number | null | undefined)[]) =>
  [...loanKeys.all, "extras", ...parts.filter((p) => p != null)] as const;

// ─── Approved-amount (doc §7.9) ────────────────────────────────────

export function useApprovedAmountHistory(loanId: number | undefined) {
  return useQuery({
    queryKey: extrasKey("approvedAmount", loanId),
    queryFn: () => fetchApprovedAmountHistory(loanId!),
    enabled: !!loanId,
    staleTime: 60_000,
  });
}

export function useUpdateApprovedAmount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload: UpdateApprovedAmountPayload }) =>
      updateApprovedAmount(loanId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: extrasKey("approvedAmount", vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
    },
  });
}

// ─── Available-disbursement-amount (doc §7.10) ─────────────────────

export function useAvailableDisbursementAmount(loanId: number | undefined) {
  return useQuery({
    queryKey: extrasKey("availableDisbursement", loanId),
    queryFn: () => fetchAvailableDisbursementAmount(loanId!),
    enabled: !!loanId,
    staleTime: 30_000,
  });
}

export function useUpdateAvailableDisbursementAmount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload: UpdateAvailableDisbursementAmountPayload }) =>
      updateAvailableDisbursementAmount(loanId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: extrasKey("availableDisbursement", vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
    },
  });
}

// ─── Re-age / Re-amortization preview (doc §7.17) ──────────────────

export function useReAgePreview(
  loanId: number | undefined,
  params: ReAgePreviewParams | null,
  enabled = true,
) {
  return useQuery({
    queryKey: extrasKey("reagePreview", loanId, params ? JSON.stringify(params) : null),
    queryFn: () => fetchReAgePreview(loanId!, params!),
    enabled: !!loanId && !!params && enabled,
    staleTime: 10_000,
  });
}

export function useReAmortizationPreview(
  loanId: number | undefined,
  params: ReAmortizationPreviewParams | null,
  enabled = true,
) {
  return useQuery({
    queryKey: extrasKey("reamortizationPreview", loanId, params ? JSON.stringify(params) : null),
    queryFn: () => fetchReAmortizationPreview(loanId!, params!),
    enabled: !!loanId && !!params && enabled,
    staleTime: 10_000,
  });
}

// ─── Delinquency actions (doc §7.26) ───────────────────────────────

export function useDelinquencyActions(loanId: number | undefined) {
  return useQuery({
    queryKey: extrasKey("delinquencyActions", loanId),
    queryFn: () => fetchDelinquencyActions(loanId!),
    enabled: !!loanId,
    staleTime: 30_000,
  });
}

export function useCreateDelinquencyAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: number; payload: CreateDelinquencyActionPayload }) =>
      createDelinquencyAction(loanId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: extrasKey("delinquencyActions", vars.loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
    },
  });
}

// ─── Guarantor templates (doc §7.27) ──────────────────────────────

export function useGuarantorTemplate(loanId: number | undefined) {
  return useQuery({
    queryKey: extrasKey("guarantorTemplate", loanId),
    queryFn: () => fetchGuarantorTemplate(loanId!),
    enabled: !!loanId,
    staleTime: 10 * 60_000,
  });
}

export function useGuarantorSavingsTemplate(loanId: number | undefined, clientId: number | undefined) {
  return useQuery({
    queryKey: extrasKey("guarantorSavingsTemplate", loanId, clientId),
    queryFn: () => fetchGuarantorSavingsTemplate(loanId!, clientId!),
    enabled: !!loanId && !!clientId,
    staleTime: 60_000,
  });
}
