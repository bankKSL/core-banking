/**
 * Finfact authentication types.
 *
 * These types mirror the Fineract POST /api/v1/authentication response
 * and the normalized user object stored in the application.
 */

/** Role object returned by Fineract in the login response. */
export interface FineractRole {
  id: number;
  name: string;
  description?: string;
  disabled?: boolean;
}

/** Raw response body from POST /api/v1/authentication?tenantIdentifier=default */
export interface FineractLoginResponse {
  username: string;
  userId: number;
  base64EncodedAuthenticationKey: string;
  authenticated: boolean;
  officeId: number;
  officeName: string;
  roles: FineractRole[];
  permissions: string[];
  shouldRenewPassword?: boolean;
  isTwoFactorAuthenticationRequired?: boolean;
  staffDisplayName?: string;
  organisationalRole?: string;
  lastLoginDateTime?: string | null;
}

/** Normalized authenticated user stored in the auth store. */
export interface AuthUser {
  userId: number;
  username: string;
  officeId: number;
  officeName: string;
  permissions: string[];
}
