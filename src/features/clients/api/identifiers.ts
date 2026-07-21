import client from "@/api/client";

// ─── Types ─────────────────────────────────────────────────────────────

export interface ClientIdentifier {
    id: number;
    clientId: number;
    documentType: {
        id: number;
        name: string;
        active?: boolean;
    };
    documentKey: string;
    description?: string;
    status?: string;
    active?: boolean;
    file?: string;
}

export interface ClientIdentifierRequest {
    documentTypeId: number;
    documentKey: string;
    description?: string;
    status?: string;
}

export interface ClientIdentifierTemplate {
    allowedDocumentTypes: Array<{
        id: number;
        name: string;
        position?: number;
        active?: boolean;
    }>;
}

export interface ClientIdentifierCommandResponse {
    clientId: number;
    resourceId: number;
    officeId?: number;
}

// ─── API Functions ─────────────────────────────────────────────────────

/**
 * GET /clients/{clientId}/identifiers
 * List all identifiers for a client.
 */
export async function fetchClientIdentifiers(
    clientId: number | string,
): Promise<ClientIdentifier[]> {
    const { data } = await client.get<ClientIdentifier[]>(
        `/clients/${clientId}/identifiers`,
    );
    return data;
}

/**
 * GET /clients/{clientId}/identifiers/template
 * Get the template for creating a client identifier (loads allowed document types).
 */
export async function fetchClientIdentifierTemplate(
    clientId: number | string,
): Promise<ClientIdentifierTemplate> {
    const { data } = await client.get<ClientIdentifierTemplate>(
        `/clients/${clientId}/identifiers/template`,
    );
    return data;
}

/**
 * GET /clients/{clientId}/identifiers/{identifierId}
 * Get a single client identifier by ID.
 */
export async function fetchClientIdentifier(
    clientId: number | string,
    identifierId: number | string,
): Promise<ClientIdentifier> {
    const { data } = await client.get<ClientIdentifier>(
        `/clients/${clientId}/identifiers/${identifierId}`,
    );
    return data;
}

/**
 * POST /clients/{clientId}/identifiers
 * Create a new client identifier.
 */
export async function createClientIdentifier(
    clientId: number | string,
    payload: ClientIdentifierRequest,
): Promise<ClientIdentifierCommandResponse> {
    const { data } = await client.post<ClientIdentifierCommandResponse>(
        `/clients/${clientId}/identifiers`,
        payload,
    );
    return data;
}

/**
 * PUT /clients/{clientId}/identifiers/{identifierId}
 * Update an existing client identifier.
 */
export async function updateClientIdentifier(
    clientId: number | string,
    identifierId: number | string,
    payload: Partial<ClientIdentifierRequest>,
): Promise<ClientIdentifierCommandResponse> {
    const { data } = await client.put<ClientIdentifierCommandResponse>(
        `/clients/${clientId}/identifiers/${identifierId}`,
        payload,
    );
    return data;
}

/**
 * DELETE /clients/{clientId}/identifiers/{identifierId}
 * Delete a client identifier.
 */
export async function deleteClientIdentifier(
    clientId: number | string,
    identifierId: number | string,
): Promise<ClientIdentifierCommandResponse> {
    const { data } = await client.delete<ClientIdentifierCommandResponse>(
        `/clients/${clientId}/identifiers/${identifierId}`,
    );
    return data;
}
