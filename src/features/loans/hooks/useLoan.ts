import { useQuery } from "@tanstack/react-query";
import { fetchLoan } from "../api/loan";
import { loanKeys } from "./useLoans";

export function useLoan(loanId: number | string | undefined) {
    return useQuery({
        queryKey: loanKeys.detail(loanId!),
        queryFn: () => fetchLoan(loanId!),
        enabled: !!loanId,
        staleTime: 60_000,
    });
}
