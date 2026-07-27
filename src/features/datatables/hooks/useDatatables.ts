import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDatatables,
  fetchDatatable,
  fetchDatatableEntries,
  createDatatableEntry,
  updateDatatableEntry,
  deleteDatatableEntry,
  registerDatatable,
  deregisterDatatable,
  createDatatable,
  deleteDatatable,
  fetchEntityDatatableChecks,
  fetchEntityDatatableCheckTemplate,
  createEntityDatatableCheck,
  deleteEntityDatatableCheck,
} from "../api/datatables";
import type { DatatableEntry } from "../api/datatables";

export const datatableKeys = {
  all: ["datatables"] as const,
  list: (apptable?: string) => [...datatableKeys.all, "list", apptable] as const,
  detail: (datatable: string) => [...datatableKeys.all, "detail", datatable] as const,
  entries: (datatable: string, apptableId: number) => [...datatableKeys.all, "entries", datatable, apptableId] as const,
  entityChecks: {
    all: ["entityDatatableChecks"] as const,
    list: () => [...datatableKeys.entityChecks.all, "list"] as const,
    template: () => [...datatableKeys.entityChecks.all, "template"] as const,
  },
};

export function useDatatables(apptable?: string) {
  return useQuery({
    queryKey: datatableKeys.list(apptable),
    queryFn: () => fetchDatatables(apptable),
    placeholderData: (prev) => prev,
  });
}

export function useDatatable(datatable: string | undefined) {
  return useQuery({
    queryKey: datatableKeys.detail(datatable!),
    queryFn: () => fetchDatatable(datatable!),
    enabled: !!datatable,
  });
}

export function useDatatableEntries(datatable: string | undefined, apptableId: number | undefined, genericResultSet?: boolean) {
  return useQuery({
    queryKey: datatableKeys.entries(datatable!, apptableId!),
    queryFn: () => fetchDatatableEntries(datatable!, apptableId!, genericResultSet),
    enabled: !!datatable && !!apptableId,
  });
}

export function useCreateDatatableEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ datatable, apptableId, payload }: { datatable: string; apptableId: number; payload: Record<string, unknown> }) =>
      createDatatableEntry(datatable, apptableId, payload),
    onSuccess: (_, { datatable, apptableId }) => {
      queryClient.invalidateQueries({ queryKey: datatableKeys.entries(datatable, apptableId) });
    },
  });
}

export function useUpdateDatatableEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ datatable, apptableId, payload }: { datatable: string; apptableId: number; payload: Record<string, unknown> }) =>
      updateDatatableEntry(datatable, apptableId, payload),
    onSuccess: (_, { datatable, apptableId }) => {
      queryClient.invalidateQueries({ queryKey: datatableKeys.entries(datatable, apptableId) });
    },
  });
}

export function useDeleteDatatableEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ datatable, apptableId }: { datatable: string; apptableId: number }) =>
      deleteDatatableEntry(datatable, apptableId),
    onSuccess: (_, { datatable, apptableId }) => {
      queryClient.invalidateQueries({ queryKey: datatableKeys.entries(datatable, apptableId) });
    },
  });
}

export function useRegisterDatatable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ datatable, apptable }: { datatable: string; apptable: string }) =>
      registerDatatable(datatable, apptable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datatableKeys.all });
    },
  });
}

export function useDeregisterDatatable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datatable: string) => deregisterDatatable(datatable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datatableKeys.all });
    },
  });
}

export function useCreateDatatable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { datatableName: string; apptableName: string; multiRow?: boolean; columns: Array<{ name: string; type: string; length: number; mandatory: boolean }> }) =>
      createDatatable(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datatableKeys.all });
    },
  });
}

export function useDeleteDatatable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datatable: string) => deleteDatatable(datatable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datatableKeys.all });
    },
  });
}

export function useEntityDatatableChecks() {
  return useQuery({
    queryKey: datatableKeys.entityChecks.list(),
    queryFn: fetchEntityDatatableChecks,
    placeholderData: (prev) => prev,
  });
}

export function useEntityDatatableCheckTemplate() {
  return useQuery({
    queryKey: datatableKeys.entityChecks.template(),
    queryFn: fetchEntityDatatableCheckTemplate,
  });
}

export function useCreateEntityDatatableCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { entity: string; status: number; datatableName: string; productId?: number }) =>
      createEntityDatatableCheck(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datatableKeys.entityChecks.all });
    },
  });
}

export function useDeleteEntityDatatableCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteEntityDatatableCheck(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datatableKeys.entityChecks.all });
    },
  });
}
