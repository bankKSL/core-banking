import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchOfficeTransactions,
  fetchOfficeTransactionTemplate,
  createOfficeTransaction,
  deleteOfficeTransaction,
} from "../api/office-transactions";
import type { OfficeTransactionCreateRequest } from "../api/office-transactions";

export const officeTransactionKeys = {
  all: ["officeTransactions"] as const,
  list: () => [...officeTransactionKeys.all, "list"] as const,
  template: () => [...officeTransactionKeys.all, "template"] as const,
};

export function useOfficeTransactions() {
  return useQuery({
    queryKey: officeTransactionKeys.list(),
    queryFn: fetchOfficeTransactions,
  });
}

export function useOfficeTransactionTemplate() {
  return useQuery({
    queryKey: officeTransactionKeys.template(),
    queryFn: fetchOfficeTransactionTemplate,
  });
}

export function useCreateOfficeTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OfficeTransactionCreateRequest) => createOfficeTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: officeTransactionKeys.all });
    },
  });
}

export function useDeleteOfficeTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteOfficeTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: officeTransactionKeys.all });
    },
  });
}
