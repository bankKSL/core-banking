import client from "@/api/client";

// ─── Types ─────────────────────────────────────────────────────────────

export interface ClientNote {
    id: number;
    clientId: number;
    note: string;
    noteType?: { id: number; code: string; value: string };
    createdByUserId?: number;
    createdByUsername?: string;
    createdOn?: string;
    updatedByUserId?: number;
    updatedByUsername?: string;
    updatedOn?: string;
}

export interface ClientNoteRequest {
    note: string;
}

export interface ClientNoteCommandResponse {
    clientId: number;
    resourceId: number;
}

// ─── API Functions ─────────────────────────────────────────────────────

/**
 * GET /clients/{clientId}/notes
 * List all notes for a client.
 * Uses the generic resource notes endpoint: /{resourceType}/{resourceId}/notes
 */
export async function fetchClientNotes(
    clientId: number | string,
): Promise<ClientNote[]> {
    const { data } = await client.get<ClientNote[]>(
        `/clients/${clientId}/notes`,
    );
    return data;
}

/**
 * GET /clients/{clientId}/notes/{noteId}
 * Get a single note by ID.
 */
export async function fetchClientNote(
    clientId: number | string,
    noteId: number | string,
): Promise<ClientNote> {
    const { data } = await client.get<ClientNote>(
        `/clients/${clientId}/notes/${noteId}`,
    );
    return data;
}

/**
 * POST /clients/{clientId}/notes
 * Create a new note for a client.
 */
export async function createClientNote(
    clientId: number | string,
    payload: ClientNoteRequest,
): Promise<ClientNoteCommandResponse> {
    const { data } = await client.post<ClientNoteCommandResponse>(
        `/clients/${clientId}/notes`,
        payload,
    );
    return data;
}

/**
 * PUT /clients/{clientId}/notes/{noteId}
 * Update an existing note.
 */
export async function updateClientNote(
    clientId: number | string,
    noteId: number | string,
    payload: ClientNoteRequest,
): Promise<ClientNoteCommandResponse> {
    const { data } = await client.put<ClientNoteCommandResponse>(
        `/clients/${clientId}/notes/${noteId}`,
        payload,
    );
    return data;
}

/**
 * DELETE /clients/{clientId}/notes/{noteId}
 * Delete a note.
 */
export async function deleteClientNote(
    clientId: number | string,
    noteId: number | string,
): Promise<ClientNoteCommandResponse> {
    const { data } = await client.delete<ClientNoteCommandResponse>(
        `/clients/${clientId}/notes/${noteId}`,
    );
    return data;
}
