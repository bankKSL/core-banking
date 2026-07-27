import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCharges,
  fetchCharge,
  fetchChargeTemplate,
  createCharge,
  updateCharge,
  deleteCharge,
} from "../api/charges";
import type { ChargeCreateRequest, ChargeUpdateRequest } from "../api/charges";

export const chargeKeys = {
  all: ["charges"] as const,
  list: () => [...chargeKeys.all, "list"] as const,
  detail: (id: number) => [...chargeKeys.all, "detail", id] as const,
  template: () => [...chargeKeys.all, "template"] as const,
};

export function useCharges() {
  return useQuery({
    queryKey: chargeKeys.list(),
    queryFn: fetchCharges,
  });
}

export function useCharge(id: number | undefined) {
  return useQuery({
    queryKey: chargeKeys.detail(id!),
    queryFn: () => fetchCharge(id!),
    enabled: !!id,
  });
}

export function useChargeTemplate() {
  return useQuery({
    queryKey: chargeKeys.template(),
    queryFn: fetchChargeTemplate,
    staleTime: 60_000,
  });
}

export function useCreateCharge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChargeCreateRequest) => createCharge(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chargeKeys.all });
    },
  });
}

export function useUpdateCharge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ChargeUpdateRequest }) => updateCharge(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: chargeKeys.all });
      queryClient.invalidateQueries({ queryKey: chargeKeys.detail(id) });
    },
  });
}

export function useDeleteCharge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCharge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chargeKeys.all });
    },
  });
}
