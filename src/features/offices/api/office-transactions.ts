import client from "@/api/client";

export interface OfficeTransaction {
  id: number;
  fromOffice: { id: number; name: string; nameDecorated: string } | null;
  toOffice: { id: number; name: string; nameDecorated: string } | null;
  transactionDate: string;
  currencyCode: string;
  transactionAmount: number;
  description: string | null;
}

export interface OfficeTransactionTemplate {
  allowedOffices: Array<{ id: number; name: string; nameDecorated: string }>;
  currencyOptions: Array<{ code: string; name: string; decimalPlaces?: number }>;
}

export interface OfficeTransactionCreateRequest {
  fromOfficeId?: number;
  toOfficeId?: number;
  transactionDate: string;
  currencyCode: string;
  transactionAmount: number;
  description?: string;
  dateFormat: string;
  locale: string;
}

export async function fetchOfficeTransactions(): Promise<OfficeTransaction[]> {
  const { data } = await client.get<OfficeTransaction[]>("/officetransactions");
  return Array.isArray(data) ? data : [];
}

export async function fetchOfficeTransactionTemplate(): Promise<OfficeTransactionTemplate> {
  const { data } = await client.get<OfficeTransactionTemplate>("/officetransactions/template");
  return data;
}

export async function createOfficeTransaction(
  payload: OfficeTransactionCreateRequest,
): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/officetransactions", payload);
  return data;
}

export async function deleteOfficeTransaction(id: number): Promise<void> {
  await client.delete(`/officetransactions/${id}`);
}
