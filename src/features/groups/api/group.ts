import client from "@/api/client";
import { currentDate } from "@/lib/utils";
import { GROUP_DATE_FORMAT, GROUP_LOCALE } from "../constants/status";
import type {
  Group,
  GroupDetail,
  GroupListParams,
  GroupListResponse,
  GroupCommandRequest,
  GroupCommandResponse,
  GroupCreateRequest,
  GroupUpdateRequest,
  GroupCloseRequest,
  GroupClientIdsPayload,
  GroupAssignStaffPayload,
  GroupAssignRolePayload,
  GroupAccountSummary,
  GroupTemplate,
  GroupTemplateParams,
} from "../types/group";

// ─── Groups ──────────────────────────────────────────────────────

/** Paged / sorted / filtered list of groups (GET /groups) */
export async function fetchGroups(params: GroupListParams = {}): Promise<GroupListResponse> {
  const { data } = await client.get<GroupListResponse>("/groups", {
    params: { paged: true, ...params },
  });
  return data;
}

/** Load group creation template (GET /groups/template) */
export async function fetchGroupTemplate(params?: GroupTemplateParams): Promise<GroupTemplate> {
  const { data } = await client.get<GroupTemplate>("/groups/template", {
    params,
  });
  return data;
}

/** Load a single group (GET /groups/{groupId}). Includes client members, roles, and calendar. */
export async function fetchGroup(groupId: number | string): Promise<GroupDetail> {
  const { data } = await client.get<GroupDetail>(`/groups/${groupId}`, {
    params: { associations: "clientMembers,groupRoles,collectionMeetingCalendar" },
  });
  return data;
}

/** Create a group (POST /groups) — activationDate mandatory when active */
export async function createGroup(payload: GroupCreateRequest): Promise<GroupCommandResponse> {
  const body: GroupCreateRequest = {
    ...payload,
    activationDate: payload.active && payload.activationDate ? currentDate(payload.activationDate) : undefined,
    dateFormat: GROUP_DATE_FORMAT,
    locale: GROUP_LOCALE,
  };
  const { data } = await client.post<GroupCommandResponse>("/groups", body);
  return data;
}

/** Update a group's name (PUT /groups/{groupId}) */
export async function updateGroup(groupId: number, payload: GroupUpdateRequest): Promise<GroupCommandResponse> {
  const { data } = await client.put<GroupCommandResponse>(`/groups/${groupId}`, payload);
  return data;
}

/** Delete a pending, unassociated group (DELETE /groups/{groupId}) */
export async function deleteGroup(groupId: number): Promise<GroupCommandResponse> {
  const { data } = await client.delete<GroupCommandResponse>(`/groups/${groupId}`);
  return data;
}

/** Activate a pending group (POST /groups/{groupId}?command=activate) */
export async function activateGroup(groupId: number, payload: GroupCommandRequest = {}): Promise<GroupCommandResponse> {
  const { data } = await client.post<GroupCommandResponse>(
    `/groups/${groupId}`,
    {
      activationDate: currentDate(payload.activationDate),
      dateFormat: GROUP_DATE_FORMAT,
      locale: GROUP_LOCALE,
    },
    { params: { command: "activate" } },
  );
  return data;
}

/** Close an active group (POST /groups/{groupId}?command=close) */
export async function closeGroup(groupId: number, payload: GroupCloseRequest): Promise<GroupCommandResponse> {
  const { data } = await client.post<GroupCommandResponse>(
    `/groups/${groupId}`,
    {
      ...payload,
      dateFormat: GROUP_DATE_FORMAT,
      locale: GROUP_LOCALE,
    },
    { params: { command: "close" } },
  );
  return data;
}

/** Associate clients (POST /groups/{groupId}?command=associateClients) */
export async function associateClients(
  groupId: number,
  payload: GroupClientIdsPayload,
): Promise<GroupCommandResponse> {
  const { data } = await client.post<GroupCommandResponse>(
    `/groups/${groupId}`,
    payload,
    { params: { command: "associateClients" } },
  );
  return data;
}

/** Disassociate clients (POST /groups/{groupId}?command=disassociateClients) */
export async function disassociateClients(
  groupId: number,
  payload: GroupClientIdsPayload,
): Promise<GroupCommandResponse> {
  const { data } = await client.post<GroupCommandResponse>(
    `/groups/${groupId}`,
    payload,
    { params: { command: "disassociateClients" } },
  );
  return data;
}

/** Assign staff (POST /groups/{groupId}?command=assignStaff) */
export async function assignStaff(groupId: number, payload: GroupAssignStaffPayload): Promise<GroupCommandResponse> {
  const { data } = await client.post<GroupCommandResponse>(
    `/groups/${groupId}`,
    payload,
    { params: { command: "assignStaff" } },
  );
  return data;
}

/** Unassign staff (POST /groups/{groupId}?command=unassignStaff) */
export async function unassignStaff(groupId: number, payload: GroupAssignStaffPayload): Promise<GroupCommandResponse> {
  const { data } = await client.post<GroupCommandResponse>(
    `/groups/${groupId}`,
    payload,
    { params: { command: "unassignStaff" } },
  );
  return data;
}

/** Assign role (POST /groups/{groupId}?command=assignRole) */
export async function assignRole(
  groupId: number,
  payload: GroupAssignRolePayload,
): Promise<GroupCommandResponse> {
  const { data } = await client.post<GroupCommandResponse>(
    `/groups/${groupId}`,
    payload,
    { params: { command: "assignRole" } },
  );
  return data;
}

/** Unassign role (POST /groups/{groupId}?command=unassignRole) */
export async function unassignRole(groupId: number, roleId: number): Promise<GroupCommandResponse> {
  const { data } = await client.post<GroupCommandResponse>(
    `/groups/${groupId}`,
    { roleId },
    { params: { command: "unassignRole" } },
  );
  return data;
}

/** Fetch group accounts (GET /groups/{groupId}/accounts) */
export async function fetchGroupAccounts(groupId: number): Promise<GroupAccountSummary> {
  const { data } = await client.get<GroupAccountSummary>(`/groups/${groupId}/accounts`);
  return data;
}

export type { Group };
