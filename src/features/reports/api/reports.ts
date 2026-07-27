import client from "@/api/client";

export interface Report {
  id: number;
  reportName: string;
  reportType: string;
  reportSubType: string;
  reportCategory: string;
  description: string;
  reportSql: string;
  coreReport: boolean;
  useReport: boolean;
  reportParameters: ReportParameter[];
}

export interface ReportParameter {
  id: number;
  parameterName: string;
  parameterType: string;
  selectOne: boolean;
  reportParameterName: string;
}

export interface ReportTemplate {
  paramTypes: Array<{ id: number; value: string }>;
  reportSubTypes: Array<{ id: number; value: string }>;
  reportCategories: Array<{ id: number; value: string }>;
}

export interface RunReportResult {
  columnHeaders: Array<{ columnName: string; columnType: string; columnLength: number }>;
  data: Array<Array<string | number | null>>;
}

export interface AdhocQuery {
  id: number;
  name: string;
  query: string;
  tableName: string;
  tableFields: string;
  isActive: boolean;
  email: string;
}

export async function fetchReports(): Promise<Report[]> {
  const { data } = await client.get<Report[]>("/reports");
  return data;
}

export async function fetchReport(id: number): Promise<Report> {
  const { data } = await client.get<Report>(`/reports/${id}`);
  return data;
}

export async function fetchReportTemplate(): Promise<ReportTemplate> {
  const { data } = await client.get<ReportTemplate>("/reports/template");
  return data;
}

export async function createReport(payload: Record<string, unknown>): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/reports", payload);
  return data;
}

export async function updateReport(id: number, payload: Record<string, unknown>): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/reports/${id}`, payload);
  return data;
}

export async function deleteReport(id: number): Promise<void> {
  await client.delete(`/reports/${id}`);
}

export async function runReport(reportName: string, params: Record<string, string>): Promise<RunReportResult> {
  const { data } = await client.get<RunReportResult>(`/runreports/${reportName}`, { params });
  return data;
}

export async function fetchAdhocQueries(): Promise<AdhocQuery[]> {
  const { data } = await client.get<AdhocQuery[]>("/adhocquery");
  return data;
}

export async function fetchAdhocQuery(id: number): Promise<AdhocQuery> {
  const { data } = await client.get<AdhocQuery>(`/adhocquery/${id}`);
  return data;
}

export async function createAdhocQuery(payload: Record<string, unknown>): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/adhocquery", payload);
  return data;
}

export async function updateAdhocQuery(id: number, payload: Record<string, unknown>): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/adhocquery/${id}`, payload);
  return data;
}

export async function deleteAdhocQuery(id: number): Promise<void> {
  await client.delete(`/adhocquery/${id}`);
}
