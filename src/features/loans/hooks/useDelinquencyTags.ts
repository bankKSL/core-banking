import { useQuery } from "@tanstack/react-query";
import { fetchDelinquencyTags } from "../api/loan";
import { loanKeys } from "./useLoans";

export function useDelinquencyTags(loanId: number | undefined) {
  return useQuery({
    queryKey: loanKeys.delinquencyTags(loanId!),
    queryFn: () => fetchDelinquencyTags(loanId!),
    enabled: !!loanId,
    staleTime: 60_000,
  });
}
