import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  fetchRecurringDepositAccounts,
  fetchRecurringDepositAccount,
  createRecurringDepositAccount,
  updateRecurringDepositAccount,
  deleteRecurringDepositAccount,
  recurringDepositCommand,
} from "../api/deposit";
import type { RecurringDepositListParams } from "../types/deposit";
import { depositKeys } from "./useSavingsAccounts";

export function useRecurringDepositAccounts(params: RecurringDepositListParams = {}) {
  return useQuery({
    queryKey: depositKeys.recurringList(params),
    queryFn: () => fetchRecurringDepositAccounts(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useRecurringDepositAccount(accountId: number | string | undefined) {
  return useQuery({
    queryKey: depositKeys.recurringDetail(accountId!),
    queryFn: () => fetchRecurringDepositAccount(accountId!),
    enabled: !!accountId,
    staleTime: 60_000,
  });
}

export function useCreateRecurringDepositAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createRecurringDepositAccount(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...depositKeys.all, "recurring"] });
    },
  });
}

export function useUpdateRecurringDepositAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: number; payload: Record<string, unknown> }) =>
      updateRecurringDepositAccount(accountId, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...depositKeys.all, "recurring"] });
      qc.invalidateQueries({ queryKey: depositKeys.recurringDetail(variables.accountId) });
    },
  });
}

export function useDeleteRecurringDepositAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: number) => deleteRecurringDepositAccount(accountId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...depositKeys.all, "recurring"] });
    },
  });
}

export function useRecurringDepositCommand() {
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
    }) => recurringDepositCommand(accountId, command, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...depositKeys.all, "recurring"] });
      qc.invalidateQueries({ queryKey: depositKeys.recurringDetail(variables.accountId) });
    },
  });
}
