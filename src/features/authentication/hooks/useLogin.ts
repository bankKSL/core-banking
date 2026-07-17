import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store";
import type { LoginFormValues } from "../schemas/login.schema";

/** Query keys for auth-related TanStack Query cache entries. */
export const authKeys = {
    all: ["auth"] as const,
    currentUser: ["auth", "currentUser"] as const,
};

/**
 * TanStack Query mutation for signing in.
 *
 * Delegates the actual API call and state management to the auth store so
 * error handling, loading flags and session persistence stay centralized.
 * On success any cached auth queries are invalidated.
 */
export function useLogin() {
    const queryClient = useQueryClient();
    const login = useAuthStore((s) => s.login);

    return useMutation({
        mutationFn: ({ username, password }: LoginFormValues) => login(username, password),
        onSuccess: (success) => {
            if (success) {
                queryClient.invalidateQueries({ queryKey: authKeys.all });
            }
        },
    });
}
