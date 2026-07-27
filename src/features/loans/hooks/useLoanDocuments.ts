import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchLoanDocuments,
  fetchLoanDocument,
  uploadLoanDocument,
  updateLoanDocument,
  deleteLoanDocument,
} from "../api/loanDocuments";

export const loanDocKeys = {
  all: ["loanDocuments"] as const,
  list: (loanId: number) => ["loanDocuments", "list", loanId] as const,
  detail: (loanId: number, docId: number) => ["loanDocuments", "detail", loanId, docId] as const,
};

export function useLoanDocuments(loanId: number | undefined) {
  return useQuery({
    queryKey: loanDocKeys.list(loanId!),
    queryFn: () => fetchLoanDocuments(loanId!),
    enabled: !!loanId,
    staleTime: 30_000,
  });
}

export function useLoanDocument(loanId: number | undefined, docId: number | undefined) {
  return useQuery({
    queryKey: loanDocKeys.detail(loanId!, docId!),
    queryFn: () => fetchLoanDocument(loanId!, docId!),
    enabled: !!loanId && !!docId,
    staleTime: 30_000,
  });
}

export function useUploadLoanDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      file,
      name,
      description,
    }: {
      loanId: number;
      file: File;
      name: string;
      description?: string;
    }) => uploadLoanDocument(loanId, file, name, description),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanDocKeys.list(vars.loanId) });
    },
  });
}

export function useUpdateLoanDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      docId,
      file,
      name,
      description,
    }: {
      loanId: number;
      docId: number;
      file?: File;
      name?: string;
      description?: string;
    }) => updateLoanDocument(loanId, docId, file, name, description),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanDocKeys.list(vars.loanId) });
    },
  });
}

export function useDeleteLoanDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, docId }: { loanId: number; docId: number }) => deleteLoanDocument(loanId, docId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: loanDocKeys.list(vars.loanId) });
    },
  });
}
