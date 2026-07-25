import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchRoles, fetchRole, createRole, updateRole, deleteRole,
  enableRole, disableRole, fetchRolePermissions, updateRolePermissions,
  fetchPermissions, updateMakerCheckerConfig,
  fetchPasswordPolicies, fetchPasswordPolicyTemplate, setActivePasswordPolicy, forgotPassword,
} from "../api/roles";
import type { RoleCreateRequest, RoleUpdateRequest, RolePermissionsUpdateRequest } from "../types/role";

export const roleKeys = {
  all: ["roles"] as const,
  list: () => ["roles", "list"] as const,
  detail: (id: number | string) => ["roles", "detail", id] as const,
  permissions: (id: number | string) => ["roles", "permissions", id] as const,
};

export function useRoles() {
  return useQuery({ queryKey: roleKeys.list(), queryFn: fetchRoles, staleTime: 60_000 });
}

export function useRole(roleId: number | string | undefined) {
  return useQuery({ queryKey: roleKeys.detail(roleId!), queryFn: () => fetchRole(roleId!), enabled: !!roleId, staleTime: 60_000 });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RoleCreateRequest) => createRole(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: number | string; payload: RoleUpdateRequest }) => updateRole(roleId, payload),
    onSuccess: (_data, vars) => { qc.invalidateQueries({ queryKey: roleKeys.all }); qc.invalidateQueries({ queryKey: roleKeys.detail(vars.roleId) }); },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roleId: number | string) => deleteRole(roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useEnableRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roleId: number | string) => enableRole(roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useDisableRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roleId: number | string) => disableRole(roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useRolePermissions(roleId: number | string | undefined) {
  return useQuery({
    queryKey: roleKeys.permissions(roleId!),
    queryFn: () => fetchRolePermissions(roleId!),
    enabled: !!roleId,
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: number | string; payload: RolePermissionsUpdateRequest }) => updateRolePermissions(roleId, payload),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: roleKeys.permissions(vars.roleId) }),
  });
}

export function usePermissions(makerCheckerable?: boolean) {
  return useQuery({
    queryKey: ["permissions", { makerCheckerable }] as const,
    queryFn: () => fetchPermissions(makerCheckerable),
    staleTime: 60_000,
  });
}

export function useUpdateMakerChecker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, boolean>) => updateMakerCheckerConfig(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["permissions"] }),
  });
}
