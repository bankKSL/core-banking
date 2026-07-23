import { useQuery } from "@tanstack/react-query";
import { fetchLoanProducts, fetchLoanProduct } from "../api/loan";
import { loanKeys } from "./useLoans";

export function useLoanProducts() {
  return useQuery({
    queryKey: loanKeys.products,
    queryFn: () => fetchLoanProducts(),
    staleTime: 5 * 60_000,
  });
}

export function useLoanProduct(productId: number | undefined) {
  return useQuery({
    queryKey: loanKeys.product(productId!),
    queryFn: () => fetchLoanProduct(productId!),
    enabled: !!productId,
    staleTime: 5 * 60_000,
  });
}
