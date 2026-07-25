import client from "@/api/client";
import type {
  LoanCharge,
  LoanChargeTemplate,
  LoanChargeCreateRequest,
  LoanChargeUpdateRequest,
  LoanChargeCommandRequest,
  LoanCommandResponse,
} from "../types/loan";

// ─── Loan Charges — /loans/{loanId}/charges ──────────────────────

export async function fetchLoanChargeTemplate(loanId: number): Promise<LoanChargeTemplate> {
  const { data } = await client.get<LoanChargeTemplate>(`/loans/${loanId}/charges/template`);
  return data;
}

export async function fetchLoanCharges(loanId: number): Promise<LoanCharge[]> {
  const { data } = await client.get<LoanCharge[]>(`/loans/${loanId}/charges`);
  return Array.isArray(data) ? data : [];
}

export async function fetchLoanCharge(loanId: number, chargeId: number): Promise<LoanCharge> {
  const { data } = await client.get<LoanCharge>(`/loans/${loanId}/charges/${chargeId}`);
  return data;
}

export async function addLoanCharge(loanId: number, payload: LoanChargeCreateRequest): Promise<LoanCommandResponse> {
  const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}/charges`, {
    ...payload,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  });
  return data;
}

export async function updateLoanCharge(
  loanId: number,
  chargeId: number,
  payload: LoanChargeUpdateRequest,
): Promise<LoanCommandResponse> {
  const { data } = await client.put<LoanCommandResponse>(`/loans/${loanId}/charges/${chargeId}`, {
    ...payload,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  });
  return data;
}

export async function deleteLoanCharge(loanId: number, chargeId: number): Promise<LoanCommandResponse> {
  const { data } = await client.delete<LoanCommandResponse>(`/loans/${loanId}/charges/${chargeId}`);
  return data;
}

/** Charge commands: pay | waive | adjustment | deactivateOverdue */
export async function loanChargeCommand(
  loanId: number,
  chargeId: number,
  command: "pay" | "waive" | "adjustment" | "deactivateOverdue",
  payload: LoanChargeCommandRequest = {},
): Promise<LoanCommandResponse> {
  const { data } = await client.post<LoanCommandResponse>(
    `/loans/${loanId}/charges/${chargeId}`,
    { ...payload, dateFormat: "yyyy-MM-dd", locale: "en" },
    { params: { command } },
  );
  return data;
}
