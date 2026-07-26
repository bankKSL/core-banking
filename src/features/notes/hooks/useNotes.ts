import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotes,
  fetchNote,
  createNote,
  updateNote,
  deleteNote,
} from "../api/notes";
import type { NoteRequest } from "../types/note";

export const noteKeys = {
  all: (resourceType: string, resourceId: number | string) => ["notes", resourceType, resourceId] as const,
  detail: (resourceType: string, resourceId: number | string, noteId: number | string) =>
    ["notes", resourceType, resourceId, noteId] as const,
};

export function useNotes(resourceType: string | undefined, resourceId: number | string | undefined) {
  return useQuery({
    queryKey: noteKeys.all(resourceType!, resourceId!),
    queryFn: () => fetchNotes(resourceType!, resourceId!),
    enabled: !!resourceType && !!resourceId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      resourceType,
      resourceId,
      payload,
    }: {
      resourceType: string;
      resourceId: number | string;
      payload: NoteRequest;
    }) => createNote(resourceType, resourceId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all(variables.resourceType, variables.resourceId) });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      resourceType,
      resourceId,
      noteId,
      payload,
    }: {
      resourceType: string;
      resourceId: number | string;
      noteId: number | string;
      payload: NoteRequest;
    }) => updateNote(resourceType, resourceId, noteId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all(variables.resourceType, variables.resourceId) });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      resourceType,
      resourceId,
      noteId,
    }: {
      resourceType: string;
      resourceId: number | string;
      noteId: number | string;
    }) => deleteNote(resourceType, resourceId, noteId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all(variables.resourceType, variables.resourceId) });
    },
  });
}
