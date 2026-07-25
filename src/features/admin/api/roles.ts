import api from "@/api/client";
import type {
  Role,
  RoleCreateRequest,
  RoleUpdateRequest,
  RolePermissionsUpdateRequest,
  Permission,
} from "../types/role";

export async function fetchRoles(): Promise<Role[]> {
  const { data } = await api.get<Role[]>("/roles");
  return data;
}

export async function fetchRole(roleId: number | string): Promise<Role> {
  const { data } = await api.get<Role>(`/roles/${roleId}`);
  return data;
}

export async function createRole(payload: RoleCreateRequest): Promise<{ resourceId: number }> {
  const { data } = await api.post<{ resourceId: number }>("/roles", payload);
  return data;
}

export async function updateRole(roleId: number | string, payload: RoleUpdateRequest): Promise<{ resourceId: number }> {
  const { data } = await api.put<{ resourceId: number }>(`/roles/${roleId}`, payload);
  return data;
}

export async function deleteRole(roleId: number | string): Promise<{ resourceId: number }> {
  const { data } = await api.delete<{ resourceId: number }>(`/roles/${roleId}`);
  return data;
}

export async function enableRole(roleId: number | string): Promise<{ resourceId: number }> {
  const { data } = await api.post<{ resourceId: number }>(`/roles/${roleId}`, null, { params: { command: "enable" } });
  return data;
}

export async function disableRole(roleId: number | string): Promise<{ resourceId: number }> {
  const { data } = await api.post<{ resourceId: number }>(`/roles/${roleId}`, null, { params: { command: "disable" } });
  return data;
}

export async function fetchRolePermissions(roleId: number | string): Promise<Role> {
  const { data } = await api.get<Role>(`/roles/${roleId}/permissions`);
  return data;
}

export async function updateRolePermissions(
  roleId: number | string,
  payload: RolePermissionsUpdateRequest,
): Promise<{ resourceId: number }> {
  const { data } = await api.put<{ resourceId: number }>(`/roles/${roleId}/permissions`, payload);
  return data;
}

export async function fetchPermissions(makerCheckerable?: boolean): Promise<Permission[]> {
  const params: Record<string, string> = {};
  if (makerCheckerable) params.makerCheckerable = "true";
  const { data } = await api.get<Permission[]>("/permissions", { params });
  return data;
}

export async function updateMakerCheckerConfig(payload: Record<string, boolean>): Promise<{ resourceId: number }> {
  const { data } = await api.put<{ resourceId: number }>("/permissions", { permissions: payload });
  return data;
}

export async function fetchPasswordPolicies(): Promise<
  Array<{ id: number; description: string; regex?: string; active?: boolean }>
> {
  const { data } = await api.get("/passwordpreferences");
  return data;
}

export async function fetchPasswordPolicyTemplate(): Promise<
  Array<{ id: number; description: string; regex?: string }>
> {
  const { data } = await api.get("/passwordpreferences/template");
  return data;
}

export async function setActivePasswordPolicy(validationPolicyId: number): Promise<{ resourceId: number }> {
  const { data } = await api.put<{ resourceId: number }>("/passwordpreferences", {
    validationPolicyId,
    locale: "en",
    dateFormat: "yyyy-MM-dd",
  });
  return data;
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/password/forgot", { email });
}
