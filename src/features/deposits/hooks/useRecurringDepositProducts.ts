import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchRecurringDepositProducts,
  fetchRecurringDepositProduct,
  createRecurringDepositProduct,
  updateRecurringDepositProduct,
  deleteRecurringDepositProduct,
} from "../api/deposit";
import { depositKeys } from "./useSavingsAccounts";
import type { RecurringDepositProductCreateRequest } from "../types/deposit";

export function useRecurringDepositProducts() {
  return useQuery({
    queryKey: [...depositKeys.all, "rdProducts"],
    queryFn: () => fetchRecurringDepositProducts(),
    staleTime: 5 * 60_000,
  });
}

export function useRecurringDepositProduct(productId: number | undefined) {
  return useQuery({
    queryKey: [...depositKeys.all, "rdProduct", productId],
    queryFn: () => fetchRecurringDepositProduct(productId!),
    enabled: !!productId,
    staleTime: 5 * 60_000,
  });
}

export function useCreateRecurringDepositProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecurringDepositProductCreateRequest) => createRecurringDepositProduct(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...depositKeys.all, "rdProducts"] });
    },
  });
}

export function useUpdateRecurringDepositProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: number;
      payload: Partial<RecurringDepositProductCreateRequest>;
    }) => updateRecurringDepositProduct(productId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...depositKeys.all, "rdProducts"] });
    },
  });
}

export function useDeleteRecurringDepositProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => deleteRecurringDepositProduct(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...depositKeys.all, "rdProducts"] });
    },
  });
}
