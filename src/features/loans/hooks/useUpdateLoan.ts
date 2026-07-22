import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateLoan } from "../api/loan";
import type { LoanCreateRequest } from "../types/loan";
import { loanKeys } from "./useLoans";

export function useUpdateLoan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ loanId, payload }: { loanId: number; payload: Partial<LoanCreateRequest> }) => updateLoan(loanId, payload),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: loanKeys.detail(vars.loanId) });
            queryClient.invalidateQueries({ queryKey: loanKeys.all });
        },
    });
}
