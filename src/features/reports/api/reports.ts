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
  name: string;
  variable: string;
  label: string;
  displayType: string;
  formatType: string;
  defaultVal: string;
  selectAll: string;
  parentParameterName: string;
  inputName: string;
  selectOptions: SelectOption[];
  childParameters: ReportParameter[];
  pentahoName: string;
}

export interface SelectOption {
  id: number;
  name: string;
}

export interface ReportTemplate {
  paramTypes: Array<{ id: number; value: string }>;
  reportSubTypes: Array<{ id: number; value: string }>;
  reportCategories: Array<{ id: number; value: string }>;
}

export interface ColumnHeader {
  columnName: string;
  columnType: string;
  columnLength: number;
  columnDisplayType: string;
}

export interface RunReportData {
  columnHeaders: ColumnHeader[];
  data: Array<{ row: Array<string | number | null> }>;
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

export async function fetchReportParams(reportName: string): Promise<ReportParameter[]> {
  const { data } = await client.get<{ data: Array<{ row: ReportParameter }> }>(
    `/runreports/FullParameterList`,
    { params: { R_reportListing: reportName, parameterType: "true" } },
  );
  return data.data.map((entry) => entry.row);
}

export async function fetchSelectOptions(inputString: string): Promise<SelectOption[]> {
  const { data } = await client.get<{ data: Array<{ row: [number, string] }> }>(
    `/runreports/${inputString}`,
    { params: { parameterType: "true" } },
  );
  return data.data.map((entry) => ({ id: entry.row[0], name: entry.row[1] }));
}

export async function runTableReport(reportName: string, params: Record<string, string>): Promise<RunReportData> {
  const { data } = await client.get<RunReportData>(`/runreports/${encodeURIComponent(reportName)}`, { params });
  return data;
}

export async function runChartReport(reportName: string, params: Record<string, string>): Promise<RunReportData> {
  const { data } = await client.get<RunReportData>(`/runreports/${encodeURIComponent(reportName)}`, { params });
  return data;
}

export async function runPentahoReport(
  reportName: string,
  params: Record<string, string>,
  locale: string,
  dateFormat: string,
): Promise<Blob> {
  const { data } = await client.get(`/runreports/${encodeURIComponent(reportName)}`, {
    params: { ...params, tenantIdentifier: "default", locale, dateFormat },
    responseType: "blob",
  });
  return data;
}

export async function runBirtReport(
  reportName: string,
  params: Record<string, string>,
  locale: string,
  dateFormat: string,
): Promise<Blob> {
  const { data } = await client.get(`/runreports/${encodeURIComponent(reportName)}`, {
    params: { ...params, tenantIdentifier: "default", locale, dateFormat },
    responseType: "blob",
  });
  return data;
}

export function formatUserResponse(
  formValues: Record<string, string | SelectOption>,
  paramData: ReportParameter[],
  reportType?: string,
): Record<string, string> {
  const formatted: Record<string, string> = {};

  for (const [key, value] of Object.entries(formValues)) {
    if (key === "outputType") {
      formatted["output-type"] = value as string;
      continue;
    }
    if (key === "exportOutputToS3") {
      formatted["exportS3"] = value as string;
      continue;
    }
    if (!value) continue;

    const param = paramData.find((p) => p.name === key);
    if (!param) {
      formatted[key] = value as string;
      continue;
    }

    const apiKey =
      (reportType === "Pentaho" || reportType === "BIRT") && param.pentahoName
        ? param.pentahoName
        : param.inputName || param.variable;

    switch (param.displayType) {
      case "select":
        formatted[apiKey] = typeof value === "object" && value !== null && "id" in value
          ? String((value as SelectOption).id)
          : (value as string);
        break;
      case "date":
        formatted[apiKey] = value as string;
        break;
      default:
        formatted[apiKey] = value as string;
    }
  }

  return formatted;
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
