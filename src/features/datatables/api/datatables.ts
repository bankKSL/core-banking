import client from "@/api/client";

export interface Datatable {
  datatableName: string;
  apptableName: string;
  multiRow: boolean;
  columns: DatatableColumn[];
}

export interface DatatableColumn {
  name: string;
  type: string;
  length: number;
  mandatory: boolean;
  code: string;
}

export interface DatatableEntry {
  [key: string]: unknown;
  id?: number;
}

export async function fetchDatatables(apptable?: string): Promise<Datatable[]> {
  const params: Record<string, string> = {};
  if (apptable) params.apptable = apptable;
  const { data } = await client.get<Datatable[]>("/datatables", { params });
  return Array.isArray(data) ? data : [];
}

export async function fetchDatatable(datatable: string): Promise<Datatable> {
  const { data } = await client.get<Datatable>(`/datatables/${datatable}`);
  return data;
}

export async function fetchDatatableEntries(datatable: string, apptableId: number, genericResultSet?: boolean): Promise<DatatableEntry[]> {
  const params: Record<string, boolean> = {};
  if (genericResultSet) params.genericResultSet = true;
  const { data } = await client.get<DatatableEntry[]>(`/datatables/${datatable}/${apptableId}`, { params });
  return Array.isArray(data) ? data : [];
}

export async function createDatatableEntry(datatable: string, apptableId: number, payload: Record<string, unknown>): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>(`/datatables/${datatable}/${apptableId}`, payload);
  return data;
}

export async function updateDatatableEntry(datatable: string, apptableId: number, payload: Record<string, unknown>): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/datatables/${datatable}/${apptableId}`, payload);
  return data;
}

export async function deleteDatatableEntry(datatable: string, apptableId: number): Promise<void> {
  await client.delete(`/datatables/${datatable}/${apptableId}`);
}

export async function registerDatatable(datatable: string, apptable: string): Promise<void> {
  await client.post(`/datatables/register/${datatable}/${apptable}`);
}

export async function deregisterDatatable(datatable: string): Promise<void> {
  await client.post(`/datatables/deregister/${datatable}`);
}

export async function createDatatable(payload: { datatableName: string; apptableName: string; multiRow?: boolean; columns: Omit<DatatableColumn, 'code'>[] }): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/datatables", payload);
  return data;
}

export async function deleteDatatable(datatable: string): Promise<void> {
  await client.delete(`/datatables/${datatable}`);
}

export interface EntityDatatableCheck {
  id: number;
  entity: string;
  status: number;
  datatableName: string;
  productId: number;
}

export interface EntityDatatableCheckTemplate {
  entities: Array<{ id: number; value: string }>;
  datatables: Array<{ datatableName: string; apptableName: string }>;
  statuses: Array<{ id: number; value: string }>;
}

export async function fetchEntityDatatableChecks(): Promise<EntityDatatableCheck[]> {
  const { data } = await client.get<EntityDatatableCheck[]>("/entityDatatableChecks");
  return Array.isArray(data) ? data : [];
}

export async function fetchEntityDatatableCheckTemplate(): Promise<EntityDatatableCheckTemplate> {
  const { data } = await client.get<EntityDatatableCheckTemplate>("/entityDatatableChecks/template");
  return data;
}

export async function createEntityDatatableCheck(payload: { entity: string; status: number; datatableName: string; productId?: number }): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/entityDatatableChecks", payload);
  return data;
}

export async function deleteEntityDatatableCheck(id: number): Promise<void> {
  await client.delete(`/entityDatatableChecks/${id}`);
}
