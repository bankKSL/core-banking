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
} from "../types/group";

// ─── Groups ──────────────────────────────────────────────────────

/** Paged / sorted / filtered list of groups (GET /groups) */
export async function fetchGroups(params: GroupListParams = {}): Promise<GroupListResponse> {
  const { data } = await client.get<GroupListResponse>("/groups", {
    params: { paged: true, ...params },
  });
  return data;
}

/** Load a single group for editing (GET /groups/{groupId}) */
export async function fetchGroup(groupId: number | string): Promise<GroupDetail> {
  const { data } = await client.get<GroupDetail>(`/groups/${groupId}`);
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

export type { Group };
