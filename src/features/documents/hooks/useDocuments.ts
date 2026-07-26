import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDocuments,
  fetchDocument,
  downloadDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../api/documents";
import type { DocumentRequest } from "../types/document";

export const documentKeys = {
  all: (entityType: string, entityId: number | string) => ["documents", entityType, entityId] as const,
  detail: (entityType: string, entityId: number | string, documentId: number | string) =>
    ["documents", entityType, entityId, documentId] as const,
};

export function useDocuments(entityType: string | undefined, entityId: number | string | undefined) {
  return useQuery({
    queryKey: documentKeys.all(entityType!, entityId!),
    queryFn: () => fetchDocuments(entityType!, entityId!),
    enabled: !!entityType && !!entityId,
  });
}

export function useDocument(
  entityType: string | undefined,
  entityId: number | string | undefined,
  documentId: number | string | undefined,
) {
  return useQuery({
    queryKey: documentKeys.detail(entityType!, entityId!, documentId!),
    queryFn: () => fetchDocument(entityType!, entityId!, documentId!),
    enabled: !!entityType && !!entityId && !!documentId,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      payload,
    }: {
      entityType: string;
      entityId: number | string;
      payload: DocumentRequest;
    }) => createDocument(entityType, entityId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all(variables.entityType, variables.entityId) });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      documentId,
      payload,
    }: {
      entityType: string;
      entityId: number | string;
      documentId: number | string;
      payload: DocumentRequest;
    }) => updateDocument(entityType, entityId, documentId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all(variables.entityType, variables.entityId) });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      documentId,
    }: {
      entityType: string;
      entityId: number | string;
      documentId: number | string;
    }) => deleteDocument(entityType, entityId, documentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all(variables.entityType, variables.entityId) });
    },
  });
}
