import client from "@/api/client";
import type { LoanGuarantor, LoanGuarantorCreateRequest, LoanCommandResponse } from "../types/loan";

// ─── Loan Guarantors — /loans/{loanId}/guarantors ────────────────

export async function fetchLoanGuarantors(loanId: number): Promise<LoanGuarantor[]> {
  const { data } = await client.get<LoanGuarantor[]>(`/loans/${loanId}/guarantors`);
  return Array.isArray(data) ? data : [];
}

export async function addLoanGuarantor(
  loanId: number,
  payload: LoanGuarantorCreateRequest,
): Promise<LoanCommandResponse> {
  const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}/guarantors`, {
    ...payload,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  });
  return data;
}

export async function updateLoanGuarantor(
  loanId: number,
  guarantorId: number,
  payload: Partial<LoanGuarantorCreateRequest>,
): Promise<LoanCommandResponse> {
  const { data } = await client.put<LoanCommandResponse>(`/loans/${loanId}/guarantors/${guarantorId}`, {
    ...payload,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  });
  return data;
}

export async function deleteLoanGuarantor(loanId: number, guarantorId: number): Promise<LoanCommandResponse> {
  const { data } = await client.delete<LoanCommandResponse>(`/loans/${loanId}/guarantors/${guarantorId}`);
  return data;
}
