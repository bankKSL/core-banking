import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { fetchFixedDepositAccounts, fetchFixedDepositAccount, deleteFixedDepositAccount, updateFixedDepositAccount, fixedDepositCommand } from "../api/deposit";
import type { FixedDepositListParams } from "../types/deposit";
import { depositKeys } from "./useSavingsAccounts";

export function useUpdateFixedDepositAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateFixedDepositAccount(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: depositKeys.all });
      queryClient.invalidateQueries({ queryKey: depositKeys.fixedDetail(variables.id) });
    },
  });
}

export function useFixedDepositAccounts(params: FixedDepositListParams = {}) {
  return useQuery({
    queryKey: depositKeys.fixedList(params),
    queryFn: () => fetchFixedDepositAccounts(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useDeleteFixedDepositAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: number) => deleteFixedDepositAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: depositKeys.all });
    },
  });
}

export function useFixedDepositAccount(accountId: number | string | undefined) {
  return useQuery({
    queryKey: depositKeys.fixedDetail(accountId!),
    queryFn: () => fetchFixedDepositAccount(accountId!),
    enabled: !!accountId,
    staleTime: 60_000,
  });
}

export function useFixedDepositCommand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      command,
      data = {},
    }: {
      accountId: number;
      command: string;
      data?: Record<string, unknown>;
    }) => fixedDepositCommand(accountId, command, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...depositKeys.all, "fixed"] });
      qc.invalidateQueries({ queryKey: depositKeys.fixedDetail(variables.accountId) });
    },
  });
}
