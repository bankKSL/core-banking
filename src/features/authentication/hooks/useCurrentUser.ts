import { useAuthStore } from "@/store";

/**
 * Hook that returns the currently authenticated user from the auth store.
 *
 * The user object is populated after a successful Fineract login and is
 * persisted across page reloads via localStorage.
 */
export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}
