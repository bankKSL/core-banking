import { useQuery } from "@tanstack/react-query";
import { fetchLoanTemplate } from "../api/loan";
import { loanKeys } from "./useLoans";

export function useLoanTemplate(clientId?: number, productId?: number) {
    return useQuery({
        queryKey: [...loanKeys.template, clientId, productId],
        queryFn: () => fetchLoanTemplate(clientId, productId),
        staleTime: 5 * 60_000,
    });
}
