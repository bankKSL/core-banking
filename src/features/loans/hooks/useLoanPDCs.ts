import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchLoanPDCs, updatePDC, bouncePDC, deletePDC } from "../api/loanPDCs";

export const pdcKeys = {
  all: ["pdc"] as const,
  list: (loanId: number) => ["pdc", "list", loanId] as const,
};

export function useLoanPDCs(loanId: number | undefined) {
  return useQuery({
    queryKey: pdcKeys.list(loanId!),
    queryFn: () => fetchLoanPDCs(loanId!),
    enabled: !!loanId,
    staleTime: 30_000,
  });
}

export function useUpdatePDC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      pdcId,
      payload,
    }: {
      loanId: number;
      pdcId: number;
      payload: Record<string, unknown>;
    }) => updatePDC(loanId, pdcId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: pdcKeys.list(vars.loanId) });
    },
  });
}

export function useBouncePDC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, pdcId }: { loanId: number; pdcId: number }) => bouncePDC(loanId, pdcId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: pdcKeys.list(vars.loanId) });
    },
  });
}

export function useDeletePDC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, pdcId }: { loanId: number; pdcId: number }) => deletePDC(loanId, pdcId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: pdcKeys.list(vars.loanId) });
    },
  });
}
