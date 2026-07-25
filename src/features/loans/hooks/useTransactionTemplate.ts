import { useQuery } from "@tanstack/react-query";
import { fetchTransactionTemplate } from "../api/loan";
import { loanKeys } from "./useLoans";

/** Transaction template for a specific command (repayment, disburse, writeoff, ...) */
export function useTransactionTemplate(loanId: number | undefined, command?: string) {
  return useQuery({
    queryKey: loanKeys.transactionTemplate(loanId!, command),
    queryFn: () => fetchTransactionTemplate(loanId!, command),
    enabled: !!loanId,
    staleTime: 30_000,
  });
}
