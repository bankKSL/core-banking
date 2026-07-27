import { useQuery } from "@tanstack/react-query";
import { fetchBuydownFees } from "../api/buydownFees";
import { fetchCapitalizedIncomes } from "../api/capitalizedIncome";

export const buydownKeys = {
  all: ["buydownFees"] as const,
  list: (loanId: number) => ["buydownFees", "list", loanId] as const,
};

export const capKeys = {
  all: ["capitalizedIncomes"] as const,
  list: (loanId: number) => ["capitalizedIncomes", "list", loanId] as const,
};

export function useBuydownFees(loanId: number | undefined) {
  return useQuery({
    queryKey: buydownKeys.list(loanId!),
    queryFn: () => fetchBuydownFees(loanId!),
    enabled: !!loanId,
    staleTime: 30_000,
  });
}

export function useCapitalizedIncomes(loanId: number | undefined) {
  return useQuery({
    queryKey: capKeys.list(loanId!),
    queryFn: () => fetchCapitalizedIncomes(loanId!),
    enabled: !!loanId,
    staleTime: 30_000,
  });
}
