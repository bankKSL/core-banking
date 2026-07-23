import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClientNotes, fetchClientNote, createClientNote, updateClientNote, deleteClientNote } from "../api/notes";
import type { ClientNoteRequest } from "../api/notes";
import { clientKeys } from "./useClients";

export const clientNoteKeys = {
  all: (clientId: number | string) => [...clientKeys.detail(clientId), "notes"] as const,
  detail: (clientId: number | string, noteId: number | string) =>
    [...clientKeys.detail(clientId), "notes", noteId] as const,
};

export function useClientNotes(clientId: number | string | undefined) {
  return useQuery({
    queryKey: clientNoteKeys.all(clientId!),
    queryFn: () => fetchClientNotes(clientId!),
    enabled: !!clientId,
  });
}

export function useCreateClientNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, payload }: { clientId: number | string; payload: ClientNoteRequest }) =>
      createClientNote(clientId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clientNoteKeys.all(variables.clientId) });
    },
  });
}

export function useUpdateClientNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      noteId,
      payload,
    }: {
      clientId: number | string;
      noteId: number | string;
      payload: ClientNoteRequest;
    }) => updateClientNote(clientId, noteId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clientNoteKeys.all(variables.clientId) });
    },
  });
}

export function useDeleteClientNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, noteId }: { clientId: number | string; noteId: number | string }) =>
      deleteClientNote(clientId, noteId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: clientNoteKeys.all(variables.clientId) });
    },
  });
}
