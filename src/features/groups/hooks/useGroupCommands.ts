import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  activateGroup,
  deleteGroup,
  closeGroup,
  associateClients,
  disassociateClients,
  assignStaff,
  unassignStaff,
  assignRole,
  unassignRole,
} from "../api/group";
import type { GroupCommandRequest, GroupCloseRequest, GroupClientIdsPayload, GroupAssignStaffPayload, GroupAssignRolePayload } from "../types/group";
import { groupKeys } from "./useGroups";

export function useActivateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: number; payload?: GroupCommandRequest }) =>
      activateGroup(groupId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(vars.groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: number) => deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

export function useCloseGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, payload }: { groupId: number; payload: GroupCloseRequest }) =>
      closeGroup(groupId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(vars.groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

export function useAssociateClients() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, clientIds }: { groupId: number; clientIds: number[] }) =>
      associateClients(groupId, { clientIds }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(vars.groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

export function useDisassociateClients() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, clientIds }: { groupId: number; clientIds: number[] }) =>
      disassociateClients(groupId, { clientIds }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(vars.groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

export function useAssignStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, staffId }: { groupId: number; staffId: number }) =>
      assignStaff(groupId, { staffId }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(vars.groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

export function useUnassignStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, staffId }: { groupId: number; staffId: number }) =>
      unassignStaff(groupId, { staffId }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(vars.groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, clientId, roleId }: { groupId: number; clientId: number; roleId: number }) =>
      assignRole(groupId, { clientId, roleId }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(vars.groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

export function useUnassignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, roleId }: { groupId: number; roleId: number }) =>
      unassignRole(groupId, roleId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(vars.groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}
