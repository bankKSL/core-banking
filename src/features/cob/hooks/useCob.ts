import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchJobNames,
  fetchSteps,
  fetchAvailableSteps,
  updateSteps,
  fetchOldestCOBClosed,
  executeCatchUp,
  fetchIsCatchUpRunning,
  fetchLockedLoans,
} from "../api/cob";
import type { UpdateStepsRequest } from "../types/cob";

export const cobKeys = {
  all: ["cob"] as const,
  jobs: ["cob", "jobs"] as const,
  steps: (jobName?: string) => ["cob", "steps", jobName] as const,
  availableSteps: (jobName?: string) => ["cob", "available-steps", jobName] as const,
  oldestCobClosed: ["cob", "oldest-cob-closed"] as const,
  catchUpRunning: ["cob", "catch-up-running"] as const,
  lockedLoans: (page?: number, limit?: number) =>
    ["cob", "locked-loans", page, limit] as const,
};

export function useJobNames() {
  return useQuery({
    queryKey: cobKeys.jobs,
    queryFn: fetchJobNames,
    staleTime: 120_000,
  });
}

export function useSteps(jobName: string | undefined) {
  return useQuery({
    queryKey: cobKeys.steps(jobName),
    queryFn: () => fetchSteps(jobName!),
    enabled: !!jobName,
    staleTime: 60_000,
  });
}

export function useAvailableSteps(jobName: string | undefined) {
  return useQuery({
    queryKey: cobKeys.availableSteps(jobName),
    queryFn: () => fetchAvailableSteps(jobName!),
    enabled: !!jobName,
    staleTime: 120_000,
  });
}

export function useUpdateSteps() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      jobName,
      payload,
    }: {
      jobName: string;
      payload: UpdateStepsRequest;
    }) => updateSteps(jobName, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: cobKeys.steps(variables.jobName) });
    },
  });
}

export function useOldestCOBClosed() {
  return useQuery({
    queryKey: cobKeys.oldestCobClosed,
    queryFn: fetchOldestCOBClosed,
    staleTime: 30_000,
    retry: false,
  });
}

export function useExecuteCatchUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: executeCatchUp,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cobKeys.oldestCobClosed });
      qc.invalidateQueries({ queryKey: cobKeys.catchUpRunning });
    },
  });
}

export function useIsCatchUpRunning() {
  return useQuery({
    queryKey: cobKeys.catchUpRunning,
    queryFn: fetchIsCatchUpRunning,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.isCatchUpRunning) return 5000;
      return false;
    },
    staleTime: 5000,
  });
}

export function useLockedLoans(page = 0, limit = 50) {
  return useQuery({
    queryKey: cobKeys.lockedLoans(page, limit),
    queryFn: () => fetchLockedLoans(page, limit),
    staleTime: 30_000,
  });
}
