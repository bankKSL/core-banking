import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  fetchJournalEntries,
  fetchJournalEntry,
  createJournalEntry,
  reverseJournalEntry,
} from "../api/accounting";
import type { JournalEntryListParams, CreateJournalEntryRequest } from "../types/accounting";
import { glAccountKeys } from "./useGLAccounts";

export const journalEntryKeys = {
  all: ["journalentries"] as const,
  list: (params: JournalEntryListParams) => ["journalentries", "list", params] as const,
  detail: (id: number | string) => ["journalentries", "detail", id] as const,
};

export function useJournalEntries(params: JournalEntryListParams = {}) {
  return useQuery({
    queryKey: journalEntryKeys.list(params),
    queryFn: () => fetchJournalEntries(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useJournalEntry(id: number | string | undefined) {
  return useQuery({
    queryKey: journalEntryKeys.detail(id!),
    queryFn: () => fetchJournalEntry(id!),
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
