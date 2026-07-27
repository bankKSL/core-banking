import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchReports,
  fetchReport,
  fetchReportTemplate,
  createReport,
  updateReport,
  deleteReport,
  runReport,
  fetchAdhocQueries,
  fetchAdhocQuery,
  createAdhocQuery,
  updateAdhocQuery,
  deleteAdhocQuery,
} from "../api/reports";

export const reportKeys = {
  all: ["reports"] as const,
  list: () => [...reportKeys.all, "list"] as const,
  detail: (id: number) => [...reportKeys.all, "detail", id] as const,
  template: () => [...reportKeys.all, "template"] as const,
};

export const adhocQueryKeys = {
  all: ["adhocQueries"] as const,
  list: () => [...adhocQueryKeys.all, "list"] as const,
  detail: (id: number) => [...adhocQueryKeys.all, "detail", id] as const,
};

export function useReports() {
  return useQuery({
    queryKey: reportKeys.list(),
    queryFn: fetchReports,
    placeholderData: (prev) => prev,
  });
}

export function useReport(id: number | undefined) {
  return useQuery({
    queryKey: reportKeys.detail(id!),
    queryFn: () => fetchReport(id!),
    enabled: !!id,
  });
}

export function useReportTemplate() {
  return useQuery({
    queryKey: reportKeys.template(),
    queryFn: fetchReportTemplate,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createReport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateReport(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
}

export interface RunReportParams {
  reportName: string;
  params: Record<string, string>;
}

export function useRunReport() {
  return useMutation({
    mutationFn: ({ reportName, params }: RunReportParams) => runReport(reportName, params),
  });
}

export function useAdhocQueries() {
  return useQuery({
    queryKey: adhocQueryKeys.list(),
    queryFn: fetchAdhocQueries,
    placeholderData: (prev) => prev,
  });
}

export function useAdhocQuery(id: number | undefined) {
  return useQuery({
    queryKey: adhocQueryKeys.detail(id!),
    queryFn: () => fetchAdhocQuery(id!),
    enabled: !!id,
  });
}

export function useCreateAdhocQuery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createAdhocQuery(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adhocQueryKeys.all });
    },
  });
}

export function useUpdateAdhocQuery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      updateAdhocQuery(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adhocQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: adhocQueryKeys.detail(id) });
    },
  });
}

export function useDeleteAdhocQuery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAdhocQuery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adhocQueryKeys.all });
    },
  });
}
