import api from "@/api/client";
import type { LoginResponse } from "../types/auth";

export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Authenticate against.
 *
 * Endpoint: POST /api/v1/authentication?tenantIdentifier=default
 * The request body contains the plaintext credentials; returns
 * a base64EncodedAuthenticationKey that must be used as the Basic Auth
 * token for every subsequent request.
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/authentication?tenantIdentifier=default", credentials);
  return data;
}
