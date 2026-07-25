import api from "@/api/client";
import type { AppUser, UserCreateRequest, UserUpdateRequest, UserTemplate, ChangePasswordRequest } from "../types/user";

export async function fetchUsers(): Promise<AppUser[]> {
  const { data } = await api.get<AppUser[]>("/users");
  return data;
}

export async function fetchUser(userId: number | string): Promise<AppUser> {
  const { data } = await api.get<AppUser>(`/users/${userId}`);
  return data;
}

export async function fetchUserTemplate(): Promise<UserTemplate> {
  const { data } = await api.get<UserTemplate>("/users/template");
  return data;
}

export async function createUser(payload: UserCreateRequest): Promise<{ resourceId: number }> {
  const { data } = await api.post<{ resourceId: number }>("/users", payload);
  return data;
}

export async function updateUser(userId: number | string, payload: UserUpdateRequest): Promise<{ resourceId: number }> {
  const { data } = await api.put<{ resourceId: number }>(`/users/${userId}`, payload);
  return data;
}

export async function deleteUser(userId: number | string): Promise<{ resourceId: number }> {
  const { data } = await api.delete<{ resourceId: number }>(`/users/${userId}`);
  return data;
}

export async function changePassword(userId: number | string, payload: ChangePasswordRequest): Promise<{ resourceId: number }> {
  const { data } = await api.post<{ resourceId: number }>(`/users/${userId}/pwd`, payload);
  return data;
}
