import api from "@/api/client";
import type { FineractLoginResponse } from "../types/auth";

export interface LoginCredentials {
    username: string;
    password: string;
}

/**
 * Authenticate against Finfact.
 *
 * Endpoint: POST /api/v1/authentication?tenantIdentifier=default
 * The request body contains the plaintext credentials; Fineract returns
 * a base64EncodedAuthenticationKey that must be used as the Basic Auth
 * token for every subsequent request.
 */
export async function login(credentials: LoginCredentials): Promise<FineractLoginResponse> {
    const { data } = await api.post<FineractLoginResponse>("/authentication?tenantIdentifier=default", credentials);
    return data;
}
