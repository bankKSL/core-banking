import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchLoanNotes,
  fetchLoanNote,
  createLoanNote,
  updateLoanNote,
  deleteLoanNote,
} from "../api/loanNotes";

export const loanNotesKeys = {
  all: ["loanNotes"] as const,
  list: (loanId: number) => ["loanNotes", "list", loanId] as const,
  detail: (loanId: number, noteId: number) => ["loanNotes", "detail", loanId, noteId] as const,
};

export function useLoanNotes(loanId: number | undefined) {
  return useQuery({
    queryKey: loanNotesKeys.list(loanId!),
    queryFn: () => fetchLoanNotes(loanId!),
    enabled: !!loanId,
    staleTime: 30_000,
  });
}

export function useLoanNote(loanId: number | undefined, noteId: number | undefined) {
  return useQuery({
    queryKey: loanNotesKeys.detail(loanId!, noteId!),
    queryFn: () => fetchLoanNote(loanId!, noteId!),
    enabled: !!loanId && !!noteId,
    staleTime: 30_000,
  });
}

export function useCreateLoanNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, note }: { loanId: number; note: string }) => createLoanNote(loanId, note),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanNotesKeys.list(vars.loanId) });
    },
  });
}

export function useUpdateLoanNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, noteId, note }: { loanId: number; noteId: number; note: string }) =>
      updateLoanNote(loanId, noteId, note),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanNotesKeys.list(vars.loanId) });
    },
  });
}

export function useDeleteLoanNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, noteId }: { loanId: number; noteId: number }) => deleteLoanNote(loanId, noteId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanNotesKeys.list(vars.loanId) });
    },
  });
}
