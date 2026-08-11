import client from "@/api/client";
import type {
  DelinquencyRange,
  DelinquencyRangeCreateRequest,
  DelinquencyRangeUpdateRequest,
  DelinquencyRangeCommandResponse,
} from "../types/delinquencyRange";

export async function fetchDelinquencyRanges(): Promise<DelinquencyRange[]> {
  const { data } = await client.get<DelinquencyRange[]>("/delinquency/ranges");
  return data;
}

export async function fetchDelinquencyRange(id: number): Promise<DelinquencyRange> {
  const { data } = await client.get<DelinquencyRange>(`/delinquency/ranges/${id}`);
  return data;
}

export async function createDelinquencyRange(payload: DelinquencyRangeCreateRequest): Promise<DelinquencyRangeCommandResponse> {
  const { data } = await client.post<DelinquencyRangeCommandResponse>("/delinquency/ranges", payload);
  return data;
}

export async function updateDelinquencyRange(id: number, payload: DelinquencyRangeUpdateRequest): Promise<DelinquencyRangeCommandResponse> {
  const { data } = await client.put<DelinquencyRangeCommandResponse>(`/delinquency/ranges/${id}`, payload);
  return data;
}

export async function deleteDelinquencyRange(id: number): Promise<DelinquencyRangeCommandResponse> {
  const { data } = await client.delete<DelinquencyRangeCommandResponse>(`/delinquency/ranges/${id}`);
  return data;
}
