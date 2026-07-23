import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store";

/**
 * Hook that performs a full logout:
 * 1. Clears the Zustand auth store (user, token, authenticated flag).
 * 2. Clears the TanStack Query cache so no stale protected data remains.
 *
 * Callers are responsible for any navigation after logout.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  return useCallback(() => {
    logout();
    queryClient.clear();
  }, [logout, queryClient]);
}
