import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTemplate,
  fetchStandingInstructions,
  fetchStandingInstruction,
  fetchHistory,
  createStandingInstruction,
  updateStandingInstruction,
  deleteStandingInstruction,
  buildCreateRequest,
  buildUpdateRequest,
} from "../api/standing-instructions";
import type {
  StandingInstructionListParams,
  StandingInstructionHistoryParams,
} from "../types/standing-instruction.types";

export const standingInstructionKeys = {
  all: ["standingInstructions"] as const,
  list: (params?: StandingInstructionListParams) =>
    [...standingInstructionKeys.all, "list", params] as const,
  detail: (id: number) => [...standingInstructionKeys.all, "detail", id] as const,
  template: (params?: Record<string, number>) =>
    [...standingInstructionKeys.all, "template", params] as const,
  history: (params?: StandingInstructionHistoryParams) =>
    [...standingInstructionKeys.all, "history", params] as const,
};

export function useTemplate(params?: Record<string, number>) {
  return useQuery({
    queryKey: standingInstructionKeys.template(params),
    queryFn: () => fetchTemplate(params),
  });
}

export function useStandingInstructions(params?: StandingInstructionListParams) {
  return useQuery({
    queryKey: standingInstructionKeys.list(params),
    queryFn: () => fetchStandingInstructions(params),
    placeholderData: (prev) => prev,
  });
}

export function useStandingInstruction(id: number | undefined) {
  return useQuery({
    queryKey: standingInstructionKeys.detail(id!),
    queryFn: () => fetchStandingInstruction(id!),
    enabled: !!id,
  });
}

export function useHistory(params?: StandingInstructionHistoryParams) {
  return useQuery({
    queryKey: standingInstructionKeys.history(params),
    queryFn: () => fetchHistory(params),
  });
}

export function useCreateStandingInstruction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      createStandingInstruction(buildCreateRequest(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: standingInstructionKeys.all });
    },
  });
}

export function useUpdateStandingInstruction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: number; values: Record<string, unknown> }) =>
      updateStandingInstruction(id, buildUpdateRequest(values)),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: standingInstructionKeys.all });
      queryClient.invalidateQueries({ queryKey: standingInstructionKeys.detail(id) });
    },
  });
}

export function useDeleteStandingInstruction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteStandingInstruction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: standingInstructionKeys.all });
    },
  });
}
