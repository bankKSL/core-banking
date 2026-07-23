import { useQuery } from "@tanstack/react-query";
import { fetchRepaymentSchedule } from "../api/loan";
import { loanKeys } from "./useLoans";

export function useRepaymentSchedule(loanId: number | undefined) {
  return useQuery({
    queryKey: loanKeys.schedule(loanId!),
    queryFn: () => fetchRepaymentSchedule(loanId!),
    enabled: !!loanId,
    staleTime: 60_000,
  });
}
