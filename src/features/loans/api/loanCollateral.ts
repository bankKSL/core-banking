import client from "@/api/client";
import type { LoanCollateral, LoanCollateralTemplate, LoanCollateralCreateRequest, LoanCommandResponse } from "../types/loan";

// ─── Loan Collateral — /loans/{loanId}/collaterals (doc §7.28) ──

/** Collateral type options (code: LoanCollateral) */
export async function fetchCollateralTemplate(): Promise<LoanCollateralTemplate> {
  const { data } = await client.get<LoanCollateralTemplate>("/loans/template", {
    params: { templateType: "collateral" },
  });
  return data;
}

export async function fetchLoanCollateral(loanId: number): Promise<LoanCollateral[]> {
  const { data } = await client.get<LoanCollateral[] | { collaterals?: LoanCollateral[] }>(
    `/loans/${loanId}/collaterals`,
  );
  if (Array.isArray(data)) return data;
  return data?.collaterals ?? [];
}

/** Single collateral with template options (doc §7.28 GET .../collaterals/{id}?template=) */
export async function fetchLoanCollateralOne(
  loanId: number,
  collateralId: number,
  template = false,
): Promise<LoanCollateral & { loanCollateralOptions?: Array<{ id: number; name: string; position?: number }> }> {
  const { data } = await client.get<
    LoanCollateral & { loanCollateralOptions?: Array<{ id: number; name: string; position?: number }> }
  >(`/loans/${loanId}/collaterals/${collateralId}`, {
    params: template ? { template: "true" } : undefined,
  });
  return data;
}

export async function addLoanCollateral(
  loanId: number,
  payload: LoanCollateralCreateRequest,
): Promise<LoanCommandResponse> {
  const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}/collaterals`, {
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
  const { data } = await client.put<LoanCommandResponse>(`/loans/${loanId}/collaterals/${collateralId}`, {
    ...payload,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  });
  return data;
}

export async function deleteLoanCollateral(loanId: number, collateralId: number): Promise<LoanCommandResponse> {
  const { data } = await client.delete<LoanCommandResponse>(`/loans/${loanId}/collaterals/${collateralId}`);
  return data;
}
