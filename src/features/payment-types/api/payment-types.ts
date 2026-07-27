import client from "@/api/client";

export interface PaymentType {
  id: number;
  name: string;
  description?: string;
  isCashPayment: boolean;
  position: number;
  codeName?: string;
  isSystemDefined: boolean;
}

export interface PaymentTypeListResponse {
  pageItems: PaymentType[];
  totalFilteredRecords: number;
}

export interface PaymentTypeCreateRequest {
  name: string;
  description?: string;
  isCashPayment: boolean;
  position: number;
  codeName?: string;
}

export interface PaymentTypeUpdateRequest {
  name: string;
  description?: string;
  isCashPayment: boolean;
  position: number;
  codeName?: string;
}

export async function fetchPaymentTypes(
  params?: { onlyWithCode?: boolean },
): Promise<PaymentTypeListResponse> {
  const { data } = await client.get<PaymentTypeListResponse>("/paymenttypes", { params });
  return data;
}

export async function fetchPaymentType(id: number): Promise<PaymentType> {
  const { data } = await client.get<PaymentType>(`/paymenttypes/${id}`);
  return data;
}

export async function createPaymentType(
  payload: PaymentTypeCreateRequest,
): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/paymenttypes", payload);
  return data;
}

export async function updatePaymentType(
  id: number,
  payload: PaymentTypeUpdateRequest,
): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/paymenttypes/${id}`, payload);
  return data;
}

export async function deletePaymentType(id: number): Promise<{ resourceId: number }> {
  const { data } = await client.delete<{ resourceId: number }>(`/paymenttypes/${id}`);
  return data;
}
