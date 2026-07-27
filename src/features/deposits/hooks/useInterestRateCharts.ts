import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchInterestRateCharts,
  fetchInterestRateChart,
  fetchInterestRateChartTemplate,
  createInterestRateChart,
  updateInterestRateChart,
  deleteInterestRateChart,
  fetchChartSlabs,
  createChartSlab,
  updateChartSlab,
  deleteChartSlab,
} from "../api/deposit";

const IRC = ["interestRateCharts"];

export const interestRateChartKeys = {
  all: IRC as readonly string[],
  list: (productId?: number) => [...IRC, "list", productId] as const,
  detail: (id: number) => [...IRC, "detail", id] as const,
  template: [...IRC, "template"] as const,
  slabs: (chartId: number) => [...IRC, "slabs", chartId] as const,
};

export function useInterestRateCharts(productId?: number) {
  return useQuery({
    queryKey: interestRateChartKeys.list(productId),
    queryFn: () => fetchInterestRateCharts(productId),
    staleTime: 5 * 60_000,
  });
}

export function useInterestRateChart(chartId: number | undefined) {
  return useQuery({
    queryKey: interestRateChartKeys.detail(chartId!),
    queryFn: () => fetchInterestRateChart(chartId!),
    enabled: !!chartId,
    staleTime: 5 * 60_000,
  });
}

export function useInterestRateChartTemplate() {
  return useQuery({
    queryKey: interestRateChartKeys.template,
    queryFn: () => fetchInterestRateChartTemplate(),
    staleTime: 10 * 60_000,
  });
}

export function useCreateInterestRateChart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createInterestRateChart(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interestRateChartKeys.all });
    },
  });
}

export function useUpdateInterestRateChart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chartId, payload }: { chartId: number; payload: Record<string, unknown> }) =>
      updateInterestRateChart(chartId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interestRateChartKeys.all });
    },
  });
}

export function useDeleteInterestRateChart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chartId: number) => deleteInterestRateChart(chartId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interestRateChartKeys.all });
    },
  });
}

export function useChartSlabs(chartId: number | undefined) {
  return useQuery({
    queryKey: interestRateChartKeys.slabs(chartId!),
    queryFn: () => fetchChartSlabs(chartId!),
    enabled: !!chartId,
    staleTime: 5 * 60_000,
  });
}

export function useCreateChartSlab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chartId, payload }: { chartId: number; payload: Record<string, unknown> }) =>
      createChartSlab(chartId, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: interestRateChartKeys.slabs(variables.chartId) });
    },
  });
}

export function useUpdateChartSlab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chartId, slabId, payload }: { chartId: number; slabId: number; payload: Record<string, unknown> }) =>
      updateChartSlab(chartId, slabId, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: interestRateChartKeys.slabs(variables.chartId) });
    },
  });
}

export function useDeleteChartSlab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chartId, slabId }: { chartId: number; slabId: number }) => deleteChartSlab(chartId, slabId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: interestRateChartKeys.slabs(variables.chartId) });
    },
  });
}
