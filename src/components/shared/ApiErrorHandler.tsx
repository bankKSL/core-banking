import { useEffect } from "react";
import { useIsMutating, useMutationState } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast";
import { getFineractErrorMessage } from "@/lib/fineract";

/**
 * Global API error listener.
 *
 * Subscribes to every mutation that just failed via the React Query
 * mutation cache and shows a toast with the Fineract error message.
 *
 * Rendering this component once at the app root is sufficient.
 */
export default function ApiErrorHandler() {
    const { error: toastError } = useToast();

    // ── Pick up newly failed mutations ──────────────────────────
    // `useMutationState` with `status: 'error'` returns all mutations
    // that are currently in error state. We key off the number of
    // errored mutations to detect changes and fire a toast.
    const failedMutations = useMutationState({
        filters: { status: "error" },
    });

    const isMutating = useIsMutating();

    useEffect(() => {
        // Only react when there's no active mutation (the error is settled)
        // AND we have at least one failed mutation.
        if (isMutating > 0 || failedMutations.length === 0) return;

        const last = failedMutations[failedMutations.length - 1];

        if (last?.error) {
            const message = getFineractErrorMessage(last.error);
            toastError("Request failed", message);
        }
        // We intentionally depend on `isMutating` falling to 0 so the
        // toast fires once per failed mutation batch, not on every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMutating, failedMutations.length]);

    return null;
}
