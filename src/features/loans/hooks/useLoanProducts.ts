import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchLoanProducts, fetchLoanProduct, fetchLoanProductTemplate, updateLoanProduct } from "../api/loan";
import type { LoanProductCreateRequest } from "../types/loan";
import { loanKeys } from "./useLoans";

export function useLoanProducts() {
  return useQuery({
    queryKey: loanKeys.products,
    queryFn: () => fetchLoanProducts(),
    staleTime: 5 * 60_000,
  });
}

/**
 * Loan products are never deleted by the backend (`DELETE /loanproducts/{id}`
 * does not exist) — deactivate them instead via `PUT /loanproducts/{id}`.
 */
export function useUpdateLoanProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: number; payload: Partial<LoanProductCreateRequest> }) =>
      updateLoanProduct(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loanKeys.products });
    },
  });
}

export function useLoanProductTemplate() {
  return useQuery({
    queryKey: loanKeys.productTemplate,
    queryFn: () => fetchLoanProductTemplate(),
    staleTime: 10 * 60_000,
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
