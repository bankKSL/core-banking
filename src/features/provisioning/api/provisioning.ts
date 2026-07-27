import client from "@/api/client";

export interface ProvisioningCategory {
  id: number;
  categoryName: string;
  categoryDescription: string;
}

export interface ProvisioningCriteria {
  id: number;
  criteriaName: string;
  createdBy: string;
  loanProducts: Array<{ id: number; name: string }>;
}

export interface ProvisioningCriteriaTemplate {
  loanProducts: Array<{ id: number; name: string; currency: { code: string } }>;
  categories: ProvisioningCategory[];
}

// ─── Categories API ─────────────────────────────────────────

export async function fetchProvisioningCategories(): Promise<ProvisioningCategory[]> {
  const { data } = await client.get<ProvisioningCategory[]>("/provisioningcategory");
  return data;
}

export async function createProvisioningCategory(payload: {
  categoryName: string;
  categoryDescription?: string;
}): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/provisioningcategory", payload);
  return data;
}

export async function updateProvisioningCategory(
  id: number,
  payload: { categoryName: string; categoryDescription?: string },
): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/provisioningcategory/${id}`, payload);
  return data;
}

export async function deleteProvisioningCategory(id: number): Promise<void> {
  await client.delete(`/provisioningcategory/${id}`);
}

// ─── Criteria API ──────────────────────────────────────────

export async function fetchProvisioningCriterias(): Promise<ProvisioningCriteria[]> {
  const { data } = await client.get<ProvisioningCriteria[]>("/provisioningcriteria");
  return data;
}

export async function fetchProvisioningCriteria(id: number): Promise<ProvisioningCriteria> {
  const { data } = await client.get<ProvisioningCriteria>(`/provisioningcriteria/${id}`);
  return data;
}

export async function fetchProvisioningCriteriaTemplate(): Promise<ProvisioningCriteriaTemplate> {
  const { data } = await client.get<ProvisioningCriteriaTemplate>("/provisioningcriteria/template");
  return data;
}

export async function createProvisioningCriteria(
  payload: Record<string, unknown>,
): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/provisioningcriteria", payload);
  return data;
}

export async function updateProvisioningCriteria(
  id: number,
  payload: Record<string, unknown>,
): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/provisioningcriteria/${id}`, payload);
  return data;
}

export async function deleteProvisioningCriteria(id: number): Promise<void> {
  await client.delete(`/provisioningcriteria/${id}`);
}
