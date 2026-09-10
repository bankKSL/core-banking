import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  fetchJournalEntries,
  fetchJournalEntry,
  createJournalEntry,
  reverseJournalEntry,
  updateRunningBalance,
  defineOpeningBalance,
  fetchOfficeOpeningBalances,
  fetchProvisioningJournalEntries,
} from "../api/accounting";
import type {
  JournalEntryListParams,
  CreateJournalEntryRequest,
  DefineOpeningBalanceRequest,
  UpdateRunningBalanceRequest,
} from "../types/accounting";
import { glAccountKeys } from "./useGLAccounts";

export const journalEntryKeys = {
  all: ["journalentries"] as const,
  list: (params: JournalEntryListParams) => ["journalentries", "list", params] as const,
  detail: (id: number | string) => ["journalentries", "detail", id] as const,
  openingBalance: (officeId?: number, currencyCode?: string) =>
    ["journalentries", "openingBalance", officeId, currencyCode] as const,
  provisioning: (params: { offset?: number; limit?: number; entryId?: number }) =>
    ["journalentries", "provisioning", params] as const,
  byEntityId: (transactionId: string, entityId: number, entityType: number) =>
    ["journalentries", "byEntityId", transactionId, entityId, entityType] as const,
};

export function useJournalEntries(params: JournalEntryListParams = {}) {
  return useQuery({
    queryKey: journalEntryKeys.list(params),
    queryFn: () => fetchJournalEntries(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useJournalEntry(
  id: number | string | undefined,
  runningBalance = false,
  transactionDetails = false,
) {
  return useQuery({
    queryKey: journalEntryKeys.detail(id!),
    queryFn: () => fetchJournalEntry(id!, runningBalance, transactionDetails),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateJournalEntryRequest) => createJournalEntry(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: journalEntryKeys.all });
      qc.invalidateQueries({ queryKey: glAccountKeys.all });
    },
  });
}

export function useReverseJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ transactionId, officeId }: { transactionId: string; officeId: number }) =>
      reverseJournalEntry(transactionId, officeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: journalEntryKeys.all });
      qc.invalidateQueries({ queryKey: glAccountKeys.all });
    },
  });
}

export function useUpdateRunningBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateRunningBalanceRequest) => updateRunningBalance(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: journalEntryKeys.all });
      qc.invalidateQueries({ queryKey: glAccountKeys.all });
    },
  });
}

export function useDefineOpeningBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DefineOpeningBalanceRequest) => defineOpeningBalance(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: journalEntryKeys.all });
      qc.invalidateQueries({ queryKey: glAccountKeys.all });
    },
  });
}

export function useOfficeOpeningBalances(officeId?: number, currencyCode?: string) {
  return useQuery({
    queryKey: journalEntryKeys.openingBalance(officeId, currencyCode),
    queryFn: () => fetchOfficeOpeningBalances(officeId, currencyCode),
    enabled: !!officeId,
    staleTime: 120_000,
  });
}

export function useProvisioningJournalEntries(params: { offset?: number; limit?: number; entryId?: number }) {
  return useQuery({
    queryKey: journalEntryKeys.provisioning(params),
    queryFn: () => fetchProvisioningJournalEntries(params),
    staleTime: 60_000,
  });
}
