import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchInterestPauses,
  createInterestPause,
  updateInterestPause,
  deleteInterestPause,
} from "../api/interestPauses";

export const pauseKeys = {
  all: ["interestPauses"] as const,
  list: (loanId: number) => ["interestPauses", "list", loanId] as const,
};

export function useInterestPauses(loanId: number | undefined) {
  return useQuery({
    queryKey: pauseKeys.list(loanId!),
    queryFn: () => fetchInterestPauses(loanId!),
    enabled: !!loanId,
    staleTime: 30_000,
  });
}

export function useCreateInterestPause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      startDate,
      endDate,
    }: {
      loanId: number;
      startDate: string;
      endDate: string;
    }) => createInterestPause(loanId, startDate, endDate),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: pauseKeys.list(vars.loanId) });
    },
  });
}

export function useUpdateInterestPause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      pauseId,
      startDate,
      endDate,
    }: {
      loanId: number;
      pauseId: number;
      startDate: string;
      endDate: string;
    }) => updateInterestPause(loanId, pauseId, startDate, endDate),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: pauseKeys.list(vars.loanId) });
    },
  });
}

export function useDeleteInterestPause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, pauseId }: { loanId: number; pauseId: number }) => deleteInterestPause(loanId, pauseId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: pauseKeys.list(vars.loanId) });
    },
  });
}
