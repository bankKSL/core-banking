import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLoan } from "../api/loan";
import type { LoanCreateRequest } from "../types/loan";
import { loanKeys } from "./useLoans";

export function useCreateLoan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: LoanCreateRequest) => createLoan(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: loanKeys.all });
        },
    });
}
