import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSavingsCharges,
  fetchSavingsChargesTemplate,
  createSavingsCharge,
  waiveSavingsCharge,
  deleteSavingsCharge,
} from "../api/deposit";
import type { PostSavingsChargeRequest } from "../api/deposit";
import { depositKeys } from "./useSavingsAccounts";

export const savingsChargeKeys = {
  all: (accountId: number | string) => [...depositKeys.savingsDetail(accountId), "charges"] as const,
  template: (accountId: number | string) => [...depositKeys.savingsDetail(accountId), "charges", "template"] as const,
};

export function useSavingsCharges(accountId: number | string | undefined) {
  return useQuery({
    queryKey: savingsChargeKeys.all(accountId!),
    queryFn: () => fetchSavingsCharges(accountId!),
    enabled: !!accountId,
  });
}

export function useSavingsChargesTemplate(accountId: number | string | undefined) {
  return useQuery({
    queryKey: savingsChargeKeys.template(accountId!),
    queryFn: () => fetchSavingsChargesTemplate(accountId!),
    enabled: !!accountId,
  });
}

export function useCreateSavingsCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: number | string; payload: PostSavingsChargeRequest }) =>
      createSavingsCharge(accountId, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: savingsChargeKeys.all(variables.accountId) });
    },
  });
}

export function useWaiveSavingsCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, chargeId }: { accountId: number | string; chargeId: number | string }) =>
      waiveSavingsCharge(accountId, chargeId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: savingsChargeKeys.all(variables.accountId) });
    },
  });
}

export function useDeleteSavingsCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, chargeId }: { accountId: number | string; chargeId: number | string }) =>
      deleteSavingsCharge(accountId, chargeId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: savingsChargeKeys.all(variables.accountId) });
    },
  });
}
