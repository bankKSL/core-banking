import { useQuery } from "@tanstack/react-query";
import { fetchLoan, fetchLoanByExternalId } from "../api/loan";
import { loanKeys } from "./useLoans";

export function useLoan(loanId: number | string | undefined, options?: { template?: boolean }) {
  return useQuery({
    queryKey: [...loanKeys.detail(loanId!), ...(options?.template ? ["template"] : [])],
    queryFn: () => fetchLoan(loanId!, "all", options?.template),
    enabled: !!loanId,
    staleTime: 60_000,
  });
}

export function useLoanByExternalId(externalId: string | undefined) {
  return useQuery({
    queryKey: loanKeys.byExternalId(externalId!),
    queryFn: () => fetchLoanByExternalId(externalId!),
    enabled: !!externalId,
    staleTime: 60_000,
  });
}
