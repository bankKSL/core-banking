import client from "@/api/client";
import { currentDate } from "@/lib/utils";

export interface TaxComponent {
  id: number;
  name: string;
  percentage: number;
  startDate: string;
  debitAccountType: { id: number; code: string; value: string } | null;
  debitAccount: { id: number; name: string; glCode: string } | null;
  creditAccountType: { id: number; code: string; value: string } | null;
  creditAccount: { id: number; name: string; glCode: string } | null;
  taxComponentHistories: Array<{ id: number; percentage: number; startDate: string }>;
}

export interface TaxComponentTemplate {
  glAccountTypeOptions: Array<{ id: number; value: string }>;
  glAccountOptions: Array<{ id: number; name: string; glCode: string }>;
}

export interface TaxGroup {
  id: number;
  name: string;
  taxComponents: TaxGroupComponent[];
}

export interface TaxGroupComponent {
  id: number;
  taxComponent: { id: number; name: string; percentage: number };
  startDate: string;
  endDate: string | null;
}

export interface TaxGroupTemplate {
  taxComponents: Array<{ id: number; name: string; percentage: number }>;
}

// Tax Components
export async function fetchTaxComponents(): Promise<TaxComponent[]> {
  const { data } = await client.get<TaxComponent[]>("/taxes/component");
  return data;
}

export async function fetchTaxComponent(id: number): Promise<TaxComponent> {
  const { data } = await client.get<TaxComponent>(`/taxes/component/${id}`);
  return data;
}

export async function fetchTaxComponentTemplate(): Promise<TaxComponentTemplate> {
  const { data } = await client.get<TaxComponentTemplate>("/taxes/component/template");
  return data;
}

export async function createTaxComponent(payload: Record<string, unknown>): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/taxes/component", payload);
  return data;
}

export async function updateTaxComponent(
  id: number,
  payload: Record<string, unknown>,
): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/taxes/component/${id}`, payload);
  return data;
}

// Tax Groups
export async function fetchTaxGroups(): Promise<TaxGroup[]> {
  const { data } = await client.get<TaxGroup[]>("/taxes/group");
  return data;
}

export async function fetchTaxGroup(id: number, withTemplate?: boolean): Promise<TaxGroup> {
  const { data } = await client.get<TaxGroup>(`/taxes/group/${id}`, {
    params: withTemplate ? { template: true } : undefined,
  });
  return data;
}

export async function fetchTaxGroupTemplate(): Promise<TaxGroupTemplate> {
  const { data } = await client.get<TaxGroupTemplate>("/taxes/group/template");
  return data;
}

export async function createTaxGroup(payload: Record<string, unknown>): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/taxes/group", payload);
  return data;
}

export async function updateTaxGroup(id: number, payload: Record<string, unknown>): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/taxes/group/${id}`, payload);
  return data;
}

export function parseDate(dateVal: number[] | null | undefined): Date | null {
  if (dateVal == null) return null;
  if (Array.isArray(dateVal) && dateVal.length >= 3) {
    return new Date(dateVal[0], dateVal[1] - 1, dateVal[2]);
  }
  return null;
}
