import { useQuery } from "@tanstack/react-query";
import { fetchLoan, fetchLoanByExternalId } from "../api/loan";
import { loanKeys } from "./useLoans";

export function useLoan(loanId: number | string | undefined) {
  return useQuery({
    queryKey: loanKeys.detail(loanId!),
    queryFn: () => fetchLoan(loanId!),
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
