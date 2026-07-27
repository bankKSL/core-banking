import client from "@/api/client";

export interface Code {
  id: number;
  name: string;
  systemDefined: boolean;
}

export interface CodeValue {
  id: number;
  name: string;
  position: number;
  description: string | null;
  isActive: boolean;
  isMandatory: boolean;
}

export async function fetchCodes(): Promise<Code[]> {
  const { data } = await client.get<Code[]>("/codes");
  return Array.isArray(data) ? data : [];
}

export async function fetchCode(id: number): Promise<Code> {
  const { data } = await client.get<Code>(`/codes/${id}`);
  return data;
}

export async function createCode(payload: { name: string }): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/codes", payload);
  return data;
}

export async function updateCode(id: number, payload: { name: string }): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/codes/${id}`, payload);
  return data;
}

export async function deleteCode(id: number): Promise<void> {
  await client.delete(`/codes/${id}`);
}

export async function fetchCodeValues(codeId: number): Promise<CodeValue[]> {
  const { data } = await client.get<CodeValue[]>(`/codes/${codeId}/codevalues`);
  return Array.isArray(data) ? data : [];
}

export async function fetchCodeValue(codeId: number, valueId: number): Promise<CodeValue> {
  const { data } = await client.get<CodeValue>(`/codes/${codeId}/codevalues/${valueId}`);
  return data;
}

export interface CodeValueCreateRequest {
  name: string;
  position?: number;
  description?: string;
  isActive?: boolean;
  isMandatory?: boolean;
}

export interface CodeValueUpdateRequest {
  name?: string;
  position?: number;
  description?: string;
  isActive?: boolean;
  isMandatory?: boolean;
}

export async function createCodeValue(codeId: number, payload: CodeValueCreateRequest): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>(`/codes/${codeId}/codevalues`, payload);
  return data;
}

export async function updateCodeValue(codeId: number, valueId: number, payload: CodeValueUpdateRequest): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/codes/${codeId}/codevalues/${valueId}`, payload);
  return data;
}

export async function deleteCodeValue(codeId: number, valueId: number): Promise<void> {
  await client.delete(`/codes/${codeId}/codevalues/${valueId}`);
}
