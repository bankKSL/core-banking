import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchLoanProducts, fetchLoanProduct, fetchLoanProductTemplate, deleteLoanProduct } from "../api/loan";
import { loanKeys } from "./useLoans";

export function useLoanProducts() {
  return useQuery({
    queryKey: loanKeys.products,
    queryFn: () => fetchLoanProducts(),
    staleTime: 5 * 60_000,
  });
}

export function useDeleteLoanProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => deleteLoanProduct(productId),
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
