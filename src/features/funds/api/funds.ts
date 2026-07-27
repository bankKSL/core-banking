import client from "@/api/client";

export interface Fund {
  id: number;
  name: string;
  externalId: string;
}

export interface FundListResponse {
  pageItems?: Fund[];
  totalFilteredRecords?: number;
}

export interface FundCreateRequest {
  name: string;
  externalId?: string;
}

export interface FundUpdateRequest {
  name?: string;
  externalId?: string;
}

export async function fetchFunds(params?: Record<string, unknown>): Promise<FundListResponse> {
  const { data } = await client.get<FundListResponse>("/funds", { params });
  return data;
}

export async function fetchFund(id: number): Promise<Fund> {
  const { data } = await client.get<Fund>(`/funds/${id}`);
  return data;
}

export async function createFund(payload: FundCreateRequest): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/funds", payload);
  return data;
}

export async function updateFund(id: number, payload: FundUpdateRequest): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/funds/${id}`, payload);
  return data;
}
