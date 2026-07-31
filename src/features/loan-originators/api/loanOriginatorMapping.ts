import client from "@/api/client";
import type { LoanOriginator, LoanOriginatorMappingResponse, LoanOriginatorsResponse } from "../types/loanOriginator";

export async function fetchLoanOriginatorsByLoan(loanId: number | string): Promise<LoanOriginator[]> {
  const { data } = await client.get<LoanOriginatorsResponse>(`/loans/${loanId}/originators`);
  return data?.originators ?? [];
}

export async function attachLoanOriginator(
  loanId: number | string,
  originatorId: number,
): Promise<LoanOriginatorMappingResponse> {
  const { data } = await client.post<LoanOriginatorMappingResponse>(`/loans/${loanId}/originators/${originatorId}`);
  return data;
}

export async function detachLoanOriginator(
  loanId: number | string,
  originatorId: number,
): Promise<LoanOriginatorMappingResponse> {
  const { data } = await client.delete<LoanOriginatorMappingResponse>(`/loans/${loanId}/originators/${originatorId}`);
  return data;
}
