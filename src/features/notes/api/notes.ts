import client from "@/api/client";
import type { Note, NoteRequest, NoteCommandResponse } from "../types/note";

export async function fetchNotes(resourceType: string, resourceId: number | string): Promise<Note[]> {
  const { data } = await client.get<Note[]>(`/${resourceType}/${resourceId}/notes`);
  return data;
}

export async function fetchNote(
  resourceType: string,
  resourceId: number | string,
  noteId: number | string,
): Promise<Note> {
  const { data } = await client.get<Note>(`/${resourceType}/${resourceId}/notes/${noteId}`);
  return data;
}

export async function createNote(
  resourceType: string,
  resourceId: number | string,
  payload: NoteRequest,
): Promise<NoteCommandResponse> {
  const { data } = await client.post<NoteCommandResponse>(`/${resourceType}/${resourceId}/notes`, payload);
  return data;
}

export async function updateNote(
  resourceType: string,
  resourceId: number | string,
  noteId: number | string,
  payload: NoteRequest,
): Promise<NoteCommandResponse> {
  const { data } = await client.put<NoteCommandResponse>(
    `/${resourceType}/${resourceId}/notes/${noteId}`,
    payload,
  );
  return data;
}

export async function deleteNote(
  resourceType: string,
  resourceId: number | string,
  noteId: number | string,
): Promise<NoteCommandResponse> {
  const { data } = await client.delete<NoteCommandResponse>(
    `/${resourceType}/${resourceId}/notes/${noteId}`,
  );
  return data;
}
