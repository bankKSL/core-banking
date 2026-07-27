import client from "@/api/client";
import { currentDate } from "@/lib/utils";

export interface CenterData {
  id: number;
  accountNo: string;
  name: string;
  externalId: string;
  officeId: number;
  officeName: string;
  staffId: number | null;
  staffName: string | null;
  hierarchy: string;
  status: { id: number; code: string; value: string };
  active: boolean;
  activationDate: string;
  timeline: { submittedOnDate: string; activatedOnDate: string | null; closedOnDate: string | null };
  groupMembers?: CenterData[];
  collectionMeetingCalendar?: unknown;
}

export interface CenterTemplate {
  officeOptions: Array<{ id: number; name: string; nameDecorated: string }>;
  staffOptions: Array<{ id: number; displayName: string }>;
  closureReasons?: Array<{ id: number; name: string }>;
  groupMembersOptions?: Array<{ id: number; name: string }>;
}

export interface CenterListParams {
  offset?: number;
  limit?: number;
  paged?: boolean;
  name?: string;
  orderBy?: string;
  sortOrder?: "ASC" | "DESC";
  officeId?: number;
  staffId?: number;
  externalId?: string;
}

export interface CenterListResponse {
  totalFilteredRecords?: number;
  pageItems?: CenterData[];
}

export async function fetchCenters(params?: CenterListParams): Promise<CenterListResponse> {
  const { data } = await client.get<CenterListResponse>("/centers", {
    params: { paged: true, ...params },
  });
  return data;
}

export async function fetchCenter(id: number, associations?: string): Promise<CenterData> {
  const { data } = await client.get<CenterData>(`/centers/${id}`, {
    params: associations ? { associations } : undefined,
  });
  return data;
}

export async function fetchCenterTemplate(officeId?: number): Promise<CenterTemplate> {
  const { data } = await client.get<CenterTemplate>("/centers/template", {
    params: officeId ? { officeId } : undefined,
  });
  return data;
}

export async function createCenter(payload: Record<string, unknown>): Promise<{ resourceId: number }> {
  const body = {
    ...payload,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  };
  const { data } = await client.post<{ resourceId: number }>("/centers", body);
  return data;
}

export async function updateCenter(id: number, payload: Record<string, unknown>): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/centers/${id}`, payload);
  return data;
}

export async function deleteCenter(id: number): Promise<void> {
  await client.delete(`/centers/${id}`);
}

export async function activateCenter(id: number, activationDate: string): Promise<void> {
  await client.post(
    `/centers/${id}`,
    {
      activationDate: currentDate(activationDate),
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    },
    { params: { command: "activate" } },
  );
}

export async function closeCenter(id: number, payload: Record<string, unknown>): Promise<void> {
  await client.post(
    `/centers/${id}`,
    { ...payload, dateFormat: "yyyy-MM-dd", locale: "en" },
    { params: { command: "close" } },
  );
}

export async function associateGroups(centerId: number, groupIds: number[]): Promise<void> {
  await client.post(`/centers/${centerId}/associategroups`, { groupMembers: groupIds });
}

export async function disassociateGroups(centerId: number, groupIds: number[]): Promise<void> {
  await client.post(`/centers/${centerId}/disassociategroups`, { groupMembers: groupIds });
}
