import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUsers, fetchUser, fetchUserTemplate, createUser, updateUser, deleteUser, changePassword,
} from "../api/users";
import type { UserCreateRequest, UserUpdateRequest, ChangePasswordRequest } from "../types/user";

export const userKeys = {
  all: ["users"] as const,
  list: () => ["users", "list"] as const,
  detail: (id: number | string) => ["users", "detail", id] as const,
  template: () => ["users", "template"] as const,
};

export function useUsers() {
  return useQuery({ queryKey: userKeys.list(), queryFn: fetchUsers, staleTime: 60_000 });
}

export function useUser(userId: number | string | undefined) {
  return useQuery({ queryKey: userKeys.detail(userId!), queryFn: () => fetchUser(userId!), enabled: !!userId, staleTime: 60_000 });
}

export function useUserTemplate() {
  return useQuery({ queryKey: userKeys.template(), queryFn: fetchUserTemplate, staleTime: 5 * 60_000 });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserCreateRequest) => createUser(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number | string; payload: UserUpdateRequest }) => updateUser(userId, payload),
    onSuccess: (_data, vars) => { qc.invalidateQueries({ queryKey: userKeys.all }); qc.invalidateQueries({ queryKey: userKeys.detail(vars.userId) }); },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number | string) => deleteUser(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useChangePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number | string; payload: ChangePasswordRequest }) => changePassword(userId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}
