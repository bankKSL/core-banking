import api from "@/api/client";
import type { LoginResponse } from "../types/auth";

export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Authenticate against.
 *
 * Endpoint: POST /api/v1/authentication
 * The request body contains the plaintext credentials; returns
 * a base64EncodedAuthenticationKey that must be used as the Basic Auth
 * token for every subsequent request.
 *
 * The `tenantIdentifier` query param is appended automatically by the
 * Axios request interceptor (see src/api/client.ts).
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/authentication", credentials);
  return data;
}
