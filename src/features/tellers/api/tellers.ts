import api from "@/api/client";
import type { Teller, TellerCreateRequest, TellerUpdateRequest, Cashier, CashierCreateRequest, CashierUpdateRequest, CashierTemplate, CashTxnRequest, CashierTransaction, CashierSummary } from "../types/teller";

export async function fetchTellers(officeId?: number): Promise<Teller[]> {
  const params: Record<string, string> = {};
  if (officeId) params.officeId = String(officeId);
  const { data } = await api.get<Teller[]>("/tellers", { params });
  return data;
}

export async function fetchTeller(tellerId: number | string): Promise<Teller> {
  const { data } = await api.get<Teller>(`/tellers/${tellerId}`);
  return data;
}

export async function createTeller(payload: TellerCreateRequest): Promise<{ resourceId: number }> {
  const { data } = await api.post<{ resourceId: number }>("/tellers", payload);
  return data;
}

export async function updateTeller(tellerId: number | string, payload: TellerUpdateRequest): Promise<{ resourceId: number }> {
  const { data } = await api.put<{ resourceId: number }>(`/tellers/${tellerId}`, payload);
  return data;
}

export async function deleteTeller(tellerId: number | string): Promise<{ resourceId: number }> {
  const { data } = await api.delete<{ resourceId: number }>(`/tellers/${tellerId}`);
  return data;
}

export async function fetchCashiers(tellerId: number | string): Promise<Cashier[]> {
  const { data } = await api.get<Cashier[]>(`/tellers/${tellerId}/cashiers`);
  return data;
}

export async function fetchCashier(tellerId: number | string, cashierId: number | string): Promise<Cashier> {
  const { data } = await api.get<Cashier>(`/tellers/${tellerId}/cashiers/${cashierId}`);
  return data;
}

export async function fetchCashierTemplate(tellerId: number | string): Promise<CashierTemplate> {
  const { data } = await api.get<CashierTemplate>(`/tellers/${tellerId}/cashiers/template`);
  return data;
}

export async function createCashier(tellerId: number | string, payload: CashierCreateRequest): Promise<{ resourceId: number }> {
  const { data } = await api.post<{ resourceId: number }>(`/tellers/${tellerId}/cashiers`, payload);
  return data;
}

export async function updateCashier(tellerId: number | string, cashierId: number | string, payload: CashierUpdateRequest): Promise<{ resourceId: number }> {
  const { data } = await api.put<{ resourceId: number }>(`/tellers/${tellerId}/cashiers/${cashierId}`, payload);
  return data;
}

export async function deleteCashier(tellerId: number | string, cashierId: number | string): Promise<{ resourceId: number }> {
  const { data } = await api.delete<{ resourceId: number }>(`/tellers/${tellerId}/cashiers/${cashierId}`);
  return data;
}

export async function allocateCash(tellerId: number | string, cashierId: number | string, payload: CashTxnRequest): Promise<{ resourceId: number }> {
  const { data } = await api.post<{ resourceId: number }>(`/tellers/${tellerId}/cashiers/${cashierId}/allocate`, payload);
  return data;
}

export async function settleCash(tellerId: number | string, cashierId: number | string, payload: CashTxnRequest): Promise<{ resourceId: number }> {
  const { data } = await api.post<{ resourceId: number }>(`/tellers/${tellerId}/cashiers/${cashierId}/settle`, payload);
  return data;
}

export async function fetchCashierTransactions(tellerId: number | string, cashierId: number | string): Promise<CashierTransaction[]> {
  const { data } = await api.get<CashierTransaction[]>(`/tellers/${tellerId}/cashiers/${cashierId}/transactions`);
  return data;
}

export async function fetchCashierSummary(tellerId: number | string, cashierId: number | string): Promise<{ summary: CashierSummary; pageItems: CashierTransaction[] }> {
  const { data } = await api.get(`/tellers/${tellerId}/cashiers/${cashierId}/summaryandtransactions`);
  return data;
}
