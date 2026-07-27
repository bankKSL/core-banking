import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPaymentTypes,
  fetchPaymentType,
  createPaymentType,
  updatePaymentType,
  deletePaymentType,
} from "../api/payment-types";

export const paymentTypeKeys = {
  all: ["paymentTypes"] as const,
  list: (params?: { onlyWithCode?: boolean }) =>
    [...paymentTypeKeys.all, "list", params] as const,
  detail: (id: number) => [...paymentTypeKeys.all, "detail", id] as const,
};

export function usePaymentTypes(params?: { onlyWithCode?: boolean }) {
  return useQuery({
    queryKey: paymentTypeKeys.list(params),
    queryFn: () => fetchPaymentTypes(params),
    placeholderData: (prev) => prev,
  });
}

export function usePaymentType(id: number | undefined) {
  return useQuery({
    queryKey: paymentTypeKeys.detail(id!),
    queryFn: () => fetchPaymentType(id!),
    enabled: !!id,
  });
}

export function useCreatePaymentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: import("../api/payment-types").PaymentTypeCreateRequest) =>
      createPaymentType(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentTypeKeys.all });
    },
  });
}

export function useUpdatePaymentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: import("../api/payment-types").PaymentTypeUpdateRequest;
    }) => updatePaymentType(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: paymentTypeKeys.all });
      queryClient.invalidateQueries({ queryKey: paymentTypeKeys.detail(id) });
    },
  });
}

export function useDeletePaymentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePaymentType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentTypeKeys.all });
    },
  });
}
