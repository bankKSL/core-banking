import client from "@/api/client";
import type { LoanCollateral, LoanCollateralTemplate, LoanCollateralCreateRequest, LoanCommandResponse } from "../types/loan";

// ─── Loan Collateral — /loans/{loanId}/collateral ────────────────

/** Collateral type options (code: LoanCollateral) */
export async function fetchCollateralTemplate(): Promise<LoanCollateralTemplate> {
  const { data } = await client.get<LoanCollateralTemplate>("/loans/template", {
    params: { templateType: "collateral" },
  });
  return data;
}

export async function fetchLoanCollateral(loanId: number): Promise<LoanCollateral[]> {
  const { data } = await client.get<LoanCollateral[]>(`/loans/${loanId}/collateral`);
  return Array.isArray(data) ? data : [];
}

export async function addLoanCollateral(
  loanId: number,
  payload: LoanCollateralCreateRequest,
): Promise<LoanCommandResponse> {
  const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}/collateral`, {
    ...payload,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  });
  return data;
}

export async function updateLoanCollateral(
  loanId: number,
  collateralId: number,
  payload: LoanCollateralCreateRequest,
): Promise<LoanCommandResponse> {
  const { data } = await client.put<LoanCommandResponse>(`/loans/${loanId}/collateral/${collateralId}`, {
    ...payload,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  });
  return data;
}

export async function deleteLoanCollateral(loanId: number, collateralId: number): Promise<LoanCommandResponse> {
  const { data } = await client.delete<LoanCommandResponse>(`/loans/${loanId}/collateral/${collateralId}`);
  return data;
}
