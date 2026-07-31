import client from "@/api/client";
import type {
  LoanOriginator,
  LoanOriginatorCommandResponse,
  LoanOriginatorRequest,
  LoanOriginatorTemplate,
  LoanOriginatorUpdateRequest,
} from "../types/loanOriginator";

export async function fetchLoanOriginators(): Promise<LoanOriginator[]> {
  const { data } = await client.get<LoanOriginator[]>("/loan-originators");
  return data;
}

export async function fetchLoanOriginator(id: number | string): Promise<LoanOriginator> {
  const { data } = await client.get<LoanOriginator>(`/loan-originators/${id}`);
  return data;
}

export async function fetchLoanOriginatorByExternalId(externalId: string): Promise<LoanOriginator> {
  const { data } = await client.get<LoanOriginator>(`/loan-originators/external-id/${externalId}`);
  return data;
}

export async function fetchLoanOriginatorTemplate(): Promise<LoanOriginatorTemplate> {
  const { data } = await client.get<LoanOriginatorTemplate>("/loan-originators/template");
  return data;
}

export async function createLoanOriginator(payload: LoanOriginatorRequest): Promise<LoanOriginatorCommandResponse> {
  const { data } = await client.post<LoanOriginatorCommandResponse>("/loan-originators", payload);
  return data;
}

export async function updateLoanOriginator(
  id: number | string,
  payload: LoanOriginatorUpdateRequest,
): Promise<LoanOriginatorCommandResponse> {
  const { data } = await client.put<LoanOriginatorCommandResponse>(`/loan-originators/${id}`, payload);
  return data;
}

export async function deleteLoanOriginator(id: number | string): Promise<LoanOriginatorCommandResponse> {
  const { data } = await client.delete<LoanOriginatorCommandResponse>(`/loan-originators/${id}`);
  return data;
}
